# Routing & Controllers Best Practices

## Use Implicit Route Model Binding

Let Laravel resolve models automatically from route parameters.

Incorrect:
```php
public function show(int $id)
{
    $post = Post::findOrFail($id);

    return Inertia::render('Posts/Show', ['post' => $post]);
}
```

Correct:
```php
public function show(Post $post)
{
    return Inertia::render('Posts/Show', ['post' => $post]);
}
```

## Use Scoped Bindings for Nested Resources

Enforce parent-child relationships automatically.

```php
Route::get('/users/{user}/posts/{post}', function (User $user, Post $post) {
    // $post is automatically scoped to $user
})->scopeBindings();
```

## Prefer Inertia Web Controllers; `apiResource` Only for Explicit APIs

Default UI routes use web controllers that return Inertia responses.

```php
Route::resource('posts', PostController::class);
```

Use `apiResource` only when you intentionally expose an HTTP API (not to feed the Vue UI):

```php
Route::apiResource('posts', Api\PostController::class);
```

## Keep Controllers Thin

Aim for under 10 lines per method. Extract business logic to service classes. The controller owns the Inertia/`redirect` response.

Incorrect:
```php
public function store(Request $request)
{
    $validated = $request->validate([...]);
    if ($request->hasFile('image')) {
        $request->file('image')->move(public_path('images'));
    }
    $post = Post::create($validated);
    $post->tags()->sync($validated['tags']);
    event(new PostCreated($post));
    return redirect()->route('posts.show', $post);
}
```

Correct:
```php
public function store(StorePostRequest $request, PostService $posts)
{
    $post = $posts->create($request->validated());

    return redirect()->route('posts.show', $post);
}
```

## Type-Hint Form Requests

Type-hinting Form Requests triggers automatic validation and authorization before the method executes.

Incorrect (UI — inline validation + JSON):
```php
public function store(Request $request): JsonResponse
{
    $validated = $request->validate([
        'title' => ['required', 'max:255'],
        'body' => ['required'],
    ]);

    $post = Post::create($validated);

    return response()->json($post, 201);
}
```

Correct (UI — Inertia):
```php
public function store(StorePostRequest $request, PostService $posts): RedirectResponse
{
    $posts->create($request->validated());

    return redirect()->route('posts.index');
}

public function show(Post $post): Response
{
    return Inertia::render('Posts/Show', [
        'post' => $post,
    ]);
}
```

Correct (explicit HTTP API only):
```php
public function store(StorePostRequest $request, PostService $posts): JsonResponse
{
    $post = $posts->create($request->validated());

    return PostResource::make($post)
        ->response()
        ->setStatusCode(201);
}
```

Do not validate inline. Do not invent REST/JSON endpoints only to feed Vue — use Inertia props.
