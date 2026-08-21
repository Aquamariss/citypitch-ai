# Service Layer — Examples

## Use Service Layer for Business Logic

Keep controllers thin. Services own business rules, orchestration, transactions, and side effects. Repositories own data access.

### Incorrect

```php
// app/Http/Controllers/UserController.php
namespace App\Http\Controllers;

use App\Events\UserRegistered;
use App\Models\User;
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
// - Eloquent queries and Model:: calls live outside repositories
```

### Correct

```php
// app/Services/User/UserService.php
namespace App\Services\User;

use App\Events\UserRegistered;
use App\Models\User;
use App\Repositories\User\Contracts\UserRepositoryInterface;
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

            if ($roleIds !== []) {
                $this->users->syncRoles($user, $roleIds);
            }

            if ($this->users->hasRole($user, 'admin')) {
                $this->users->update($user, ['is_active' => false]);
            }

            // Fire only after a successful commit (safe with nested transactions)
            DB::afterCommit(fn () => UserRegistered::dispatch($user));

            return $user;
        });
    }
}

// app/Http/Controllers/UserController.php
namespace App\Http\Controllers;

use App\Http\Requests\StoreUserRequest;
use App\Http\Resources\UserResource;
use App\Services\User\UserService;
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

        return (new UserResource($user->load('roles')))
            ->response()
            ->setStatusCode(201);
    }
}

// In tests, mock the repository and test business logic in isolation:
//
// $mock = $this->mock(UserRepositoryInterface::class);
// $mock->shouldReceive('create')->once()->andReturn($user);
// $mock->shouldReceive('syncRoles')->once();
// $mock->shouldReceive('hasRole')->once()->with($user, 'admin')->andReturn(false);
//
// $service = new UserService($mock);
// $result = $service->register([...], [1, 2]);
```

### Events after commit

Dispatch side effects only after the write succeeds:

```php
return DB::transaction(function () use ($data) {
    $order = $this->orders->create($data);

    DB::afterCommit(fn () => OrderPlaced::dispatch($order));

    return $order;
});
```

Avoid dispatching events mid-transaction unless the event implements `ShouldDispatchAfterCommit`. Listeners must not observe uncommitted state.

### Controller → Repository (read-only exception)

Simple listing/filtering may call the repository directly — no business logic involved. Still accept a Form Request and return an API Resource:

```php
public function index(IndexUsersRequest $request): AnonymousResourceCollection
{
    return UserResource::collection(
        $this->users->search($request->validated(), $request->integer('per_page', 15))
    );
}
```

### Thin Jobs and Commands

A queue job (or Artisan command) is an entrypoint — it must not contain `Process`/`Storage`/`DB`/decision logic. Move the work into a service and inject it into `handle()`.

#### Incorrect

```php
// app/Jobs/ProcessVideoJob.php — ffmpeg orchestration inside the job
class ProcessVideoJob implements ShouldQueue
{
    public function handle(AdvertModuleRepositoryInterface $modules): void
    {
        $module = $modules->find($this->moduleId);
        $probe = Process::fromShellCommandline('ffprobe ... '.$this->videoPath)->run(); // side effect in entrypoint
        // ... codec parsing, transcode decision, thumbnail, Storage::delete ...
        $modules->update($this->moduleId, [...]);
    }
}
```

#### Correct

```php
// app/Jobs/ProcessVideoJob.php — thin adapter
class ProcessVideoJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        protected int $moduleId,
        protected string $videoPath,
        protected string $dbPath,
        protected string $filename,
    ) {}

    public function handle(VideoProcessingService $videoProcessingService): void
    {
        $videoProcessingService->processForModule(
            $this->moduleId, $this->videoPath, $this->dbPath, $this->filename
        );
    }
}

// app/Services/Media/VideoProcessingService.php — owns Process/Storage/Log/decisions
class VideoProcessingService
{
    public function __construct(
        protected AdvertModuleRepositoryInterface $moduleRepository,
    ) {}

    public function processForModule(int $moduleId, string $videoPath, string $dbPath, string $filename): void
    {
        // ffprobe, codec/resolution decision, thumbnail, transcode, repository update
    }
}
```

The same shape applies to Artisan commands: `handle()` parses options, calls the service, prints the result. No `DB::transaction()` or chunk loops in the command.
