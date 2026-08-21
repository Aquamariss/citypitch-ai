# Repository Pattern — Examples

## Use Repository Pattern for Data Access

Abstract Eloquent queries behind repository interfaces instead of scattering query logic across controllers, services, and jobs. This keeps query logic in one place, makes services testable (mock the contract), and allows you to swap the data source without touching business logic.

### Incorrect

```php
// app/Http/Controllers/UserController.php
namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        // Eloquent queries scattered directly in the controller
        $users = User::query()
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
            })
            ->when($request->role, function ($query, $role) {
                $query->whereHas('roles', fn ($q) => $q->where('slug', $role));
            })
            ->when($request->status === 'active', function ($query) {
                $query->whereNotNull('email_verified_at')
                      ->where('is_active', true);
            })
            ->with(['roles', 'department'])
            ->orderBy($request->sort_by ?? 'created_at', $request->sort_dir ?? 'desc')
            ->paginate($request->per_page ?? 15);

        return response()->json($users);
    }

    public function store(Request $request): JsonResponse
    {
        // Direct model creation in the controller
        $user = User::create($request->validated());
        $user->roles()->sync($request->input('role_ids', []));

        return response()->json($user->load('roles'), 201);
    }

    public function findActiveByDepartment(int $departmentId): JsonResponse
    {
        // Same query patterns duplicated across multiple controllers/services
        $users = User::where('department_id', $departmentId)
            ->whereNotNull('email_verified_at')
            ->where('is_active', true)
            ->with('roles')
            ->get();

        return response()->json($users);
    }
}

// Problems:
// - Query logic duplicated across controllers, services, jobs
// - Cannot unit-test business logic without hitting the database
// - Changing the "active user" definition requires updating dozens of files
// - Controller is doing data-access work instead of HTTP concerns
```

### Correct

```php
// Step 1: Define the interface

// app/Repositories/User/Contracts/UserRepositoryInterface.php
namespace App\Repositories\User\Contracts;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface UserRepositoryInterface
{
    public function findOrFail(int $id): User;

    public function search(array $filters, int $perPage = 15): LengthAwarePaginator;

    public function findActiveByDepartment(int $departmentId): Collection;

    public function create(array $attributes): User;

    public function update(User $user, array $attributes): User;

    public function syncRoles(User $user, array $roleIds): void;

    public function hasRole(User $user, string $roleSlug): bool;
}

// Step 2: Implement with Eloquent

// app/Repositories/User/UserRepository.php
namespace App\Repositories\User;

use App\Models\User;
use App\Repositories\User\Contracts\UserRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class UserRepository implements UserRepositoryInterface
{
    public function findOrFail(int $id): User
    {
        return User::with(['roles', 'department'])->findOrFail($id);
    }

    public function search(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        return User::query()
            ->when($filters['search'] ?? null, function (Builder $query, string $search) {
                $query->where(function (Builder $q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($filters['role'] ?? null, function (Builder $query, string $role) {
                $query->whereHas('roles', fn (Builder $q) => $q->where('slug', $role));
            })
            ->when(($filters['status'] ?? null) === 'active', function (Builder $query) {
                $this->scopeActive($query);
            })
            ->with(['roles', 'department'])
            ->orderBy(
                $filters['sort_by'] ?? 'created_at',
                $filters['sort_dir'] ?? 'desc',
            )
            ->paginate($perPage);
    }

    public function findActiveByDepartment(int $departmentId): Collection
    {
        return User::where('department_id', $departmentId)
            ->where(fn (Builder $query) => $this->scopeActive($query))
            ->with('roles')
            ->get();
    }

    public function create(array $attributes): User
    {
        return User::create($attributes);
    }

    public function update(User $user, array $attributes): User
    {
        $user->update($attributes);

        return $user->refresh();
    }

    public function syncRoles(User $user, array $roleIds): void
    {
        $user->roles()->sync($roleIds);
    }

    public function hasRole(User $user, string $roleSlug): bool
    {
        return $user->roles()->where('slug', $roleSlug)->exists();
    }

    /**
     * Reusable "active user" scope -- defined once, used everywhere.
     */
    private function scopeActive(Builder $query): Builder
    {
        return $query->whereNotNull('email_verified_at')
                     ->where('is_active', true);
    }
}

// Step 3: Bind in the Service Provider

// app/Providers/AppServiceProvider.php
namespace App\Providers;

use App\Repositories\User\Contracts\UserRepositoryInterface;
use App\Repositories\User\UserRepository;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(UserRepositoryInterface::class, UserRepository::class);
    }
}

// Step 4: Use the interface in services and controllers

// app/Services/User/UserService.php
namespace App\Services\User;

use App\Events\UserRegistered;
use App\Models\User;
use App\Repositories\User\Contracts\UserRepositoryInterface;
use Illuminate\Support\Facades\DB;

class UserService
{
    public function __construct(
        private readonly UserRepositoryInterface $users,
    ) {}

    public function register(array $data, array $roleIds = []): User
    {
        return DB::transaction(function () use ($data, $roleIds) {
            $user = $this->users->create($data);

            if ($roleIds !== []) {
                $this->users->syncRoles($user, $roleIds);
            }

            DB::afterCommit(fn () => UserRegistered::dispatch($user));

            return $user;
        });
    }
}

// app/Http/Controllers/UserController.php
namespace App\Http\Controllers;

use App\Http\Requests\IndexUsersRequest;
use App\Http\Resources\UserResource;
use App\Repositories\User\Contracts\UserRepositoryInterface;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controller;

class UserController extends Controller
{
    public function __construct(
        private readonly UserRepositoryInterface $users,
    ) {}

    public function index(IndexUsersRequest $request): AnonymousResourceCollection
    {
        return UserResource::collection(
            $this->users->search(
                filters: $request->validated(),
                perPage: $request->integer('per_page', 15),
            )
        );
    }
}

// In tests, mock the repository easily:
//
// $mock = $this->mock(UserRepositoryInterface::class);
// $mock->shouldReceive('search')
//      ->with(['search' => 'jane'], 15)
//      ->andReturn(new LengthAwarePaginator([$fakeUser], 1, 15));
```

Reference: [Laravel Service Container](https://laravel.com/docs/container)
