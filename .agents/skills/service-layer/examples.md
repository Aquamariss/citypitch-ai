# Service Layer — Examples

## Use Service Layer for Business Logic

Keep controllers thin. Services own business rules, orchestration, transactions, and side effects. Repositories own data access.

### Incorrect

```php
// app/Domains/User/Controllers/UserController.php
namespace App\Domains\User\Controllers;

use App\Domains\User\Models\User;
use App\Domains\User\Events\UserRegistered;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        // Business logic, transactions, and side effects in the controller
        $user = DB::transaction(function () use ($request) {
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
            ]);

            $user->roles()->sync($request->input('role_ids', []));

            if ($user->roles()->where('slug', 'admin')->exists()) {
                $user->update(['is_active' => false]); // pending admin approval
            }

            UserRegistered::dispatch($user);

            return $user;
        });

        return response()->json($user->load('roles'), 201);
    }
}

// Problems:
// - Business rules ("admin needs approval") live in the controller
// - Cannot reuse registration logic from jobs, commands, or tests
// - Controller mixes HTTP, persistence, and domain events
// - Hard to unit-test without HTTP layer
```

### Correct

```php
// app/Domains/User/Services/UserService.php
namespace App\Domains\User\Services;

use App\Domains\User\Events\UserRegistered;
use App\Domains\User\Models\User;
use App\Domains\User\Repositories\UserRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserService
{
    public function __construct(
        private readonly UserRepositoryInterface $users,
    ) {}

    public function register(array $data, array $roleIds = []): User
    {
        return DB::transaction(function () use ($data, $roleIds) {
            $user = $this->users->create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
            ]);

            if ($roleIds) {
                $this->users->syncRoles($user, $roleIds);
            }

            if ($this->requiresApproval($user)) {
                $this->users->update($user, ['is_active' => false]);
            }

            UserRegistered::dispatch($user);

            return $user;
        });
    }

    private function requiresApproval(User $user): bool
    {
        return $user->roles()->where('slug', 'admin')->exists();
    }
}

// app/Domains/User/Controllers/UserController.php
namespace App\Domains\User\Controllers;

use App\Domains\User\Requests\StoreUserRequest;
use App\Domains\User\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

class UserController extends Controller
{
    public function __construct(
        private readonly UserService $userService,
    ) {}

    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = $this->userService->register(
            data: $request->safe()->only(['name', 'email', 'password']),
            roleIds: $request->input('role_ids', []),
        );

        return response()->json($user->load('roles'), 201);
    }
}

// In tests, mock the repository and test business logic in isolation:
//
// $mock = $this->mock(UserRepositoryInterface::class);
// $mock->shouldReceive('create')->once()->andReturn($user);
// $mock->shouldReceive('syncRoles')->once();
//
// $service = new UserService($mock);
// $result = $service->register([...], [1, 2]);
```

### Controller → Repository (read-only exception)

Simple listing/filtering may call the repository directly — no business logic involved:

```php
public function index(IndexUsersRequest $request): JsonResponse
{
    return response()->json(
        $this->users->search($request->validated(), $request->integer('per_page', 15))
    );
}
```
