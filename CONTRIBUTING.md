# Contributing

Thanks for improving the KakaoTalk Raycast extension.

## Development

```bash
npm install
npm run dev
```

Run checks before opening a pull request:

```bash
npm run lint
npm run build
```

## Scope

This project is designed for public Raycast Store distribution. Contributions should avoid:

- reading KakaoTalk local databases
- scraping message history
- using unofficial KakaoTalk network protocols
- sending data to external services

Keep automation local, transparent, and scoped to explicit user actions.
