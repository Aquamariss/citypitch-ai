# Validation & Forms Best Practices

## Use Form Request Classes

Extract validation from controllers into dedicated Form Request classes.

Incorrect:
```php
public function store(Request $request)
{
    $request->validate([
        'title' => 'required|max:255',
        'body' => 'required',
    ]);
}
```

Correct:
```php
public function store(StorePostRequest $request)
{
    Post::create($request->validated());
}
```

## Always Use Array Notation for Rules

Always write validation rules as arrays. Do not use pipe-delimited strings.

Incorrect:
```php
'service_id' => 'required|integer',
'active' => 'nullable|integer|in:0,1',
```

Correct:
```php
'service_id' => ['required', 'integer'],
'active' => ['nullable', 'integer', 'in:0,1'],
'email' => ['required', 'email', Rule::unique('users')],
```

## Use snake_case for Request and Response Field Names

Form Request keys, Inertia props, and API Resource output keys follow Laravel and database conventions: **snake_case**. Do not use camelCase for request or response fields.

Incorrect:
```php
// Form Request
'serviceId' => ['required', 'integer'],
'dateFrom' => ['nullable', 'date'],

// Inertia props / API Resource
return [
    'serviceId' => $this->service_id,
    'createdAt' => $this->created_at,
];
```

Correct:
```php
// Form Request
'service_id' => ['required', 'integer'],
'date_from' => ['nullable', 'date'],

// Inertia props / API Resource
return [
    'service_id' => $this->service_id,
    'created_at' => $this->created_at,
];
```

## Always Use `validated()`

Get only validated data. Never use `$request->all()` for mass operations.

Incorrect:
```php
Post::create($request->all());
```

Correct:
```php
Post::create($request->validated());
```

## Use `Rule::when()` for Conditional Validation

```php
'company_name' => [
    Rule::when($this->account_type === 'business', ['required', 'string', 'max:255']),
],
```

## Use the `after()` Method for Custom Validation

Use `after()` instead of `withValidator()` for custom validation logic that depends on multiple fields.

```php
public function after(): array
{
    return [
        function (Validator $validator) {
            if ($this->quantity > Product::find($this->product_id)?->stock) {
                $validator->errors()->add('quantity', 'Not enough stock.');
            }
        },
    ];
}
```
