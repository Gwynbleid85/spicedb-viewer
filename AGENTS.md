

- Use shadcn for most of the UI components based on mono-ui
- For form use ALWAYS react-hook-form, never use useState for form state management. react-hook-form is optimized for performance and provides a better developer experience. And aways use zod for validation, never use yup. Zod is more powerful and provides better TypeScript support.
- Use tanstack-query for data fetching and caching, never use useEffect for data fetching. tanstack-query provides a better developer experience and is optimized for performance.
- Use better-auth for authentication, never use custom authentication solutions. better-auth provides a better developer experience and is optimized for security.
- Use drizzle-orm for database access, never use raw SQL queries. drizzle-orm provides a better developer experience and is optimized for performance.
- Always validate server function inputs with zod, never trust client input. This is crucial for security and data integrity.
- Use server functions for all server-side logic, never use API routes. Server functions provide a better developer experience and are optimized for performance.
- Always handle errors gracefully and provide meaningful error messages to the client. This improves the user experience and helps with debugging.
- Always write tests for your code, never skip testing. Tests help ensure the reliability and maintainability of your codebase.
- Always keep your dependencies up to date, never use outdated libraries. This helps ensure you have the latest features and security patches.
- Always document your code, never leave it undocumented. This helps other developers understand your code and makes it easier to maintain.
- Always follow best practices for security, such as hashing passwords and using HTTPS. This helps protect your users' data and ensures the integrity of your application.
- Always optimize for performance, such as using memoization and lazy loading. This helps improve the user experience and reduces server load.
- Always use environment variables for configuration, never hardcode sensitive information. This helps keep your application secure and makes it easier to manage different environments (development, staging, production).