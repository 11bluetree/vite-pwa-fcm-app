# React + TypeScript + Vite + PWA + Push Notifications

This template provides a minimal setup to get React working in Vite with HMR, ESLint rules, PWA support, and push notification functionality.

## Features

- ⚛️ React 19 with TypeScript
- ⚡ Vite for fast development and building
- 📱 PWA (Progressive Web App) support
- 🔔 Push notification functionality
- 🛠️ Service Worker with Workbox
- 🎨 CSS styling for components

## Push Notifications

This app includes a complete push notification system with:

- **Subscription Management**: Users can subscribe/unsubscribe to push notifications
- **Permission Handling**: Automatic browser notification permission requests
- **Test Notifications**: Send test notifications to verify functionality
- **Service Worker Integration**: Full service worker support for background notifications

### How to use Push Notifications

1. **Start the application**:

   ```bash
   npm run dev
   ```

2. **Subscribe to notifications**:
   - Click the "プッシュ通知を購読" (Subscribe to Push Notifications) button
   - Allow notification permissions when prompted
   - The app will automatically send a test notification after 5 seconds

3. **Test notifications**:
   - Once subscribed, use the "テスト通知を送信" (Send Test Notification) button
   - Notifications will appear even when the browser tab is not active

4. **Stop Notifications**:
   - Click "通知を停止" (Stop Notifications) to completely unsubscribe and delete the FCM token

### Files Structure

```
src/
├── sw-fcm-push.ts               # FCM Service Worker with background message handlers
├── components/
│   ├── FCMNotification.tsx      # FCM React component for notification management
│   └── FCMNotification.css      # Styles for the FCM notification component
├── services/
│   └── fcm-service.ts           # FCM token management and messaging service
├── firebase-config.ts           # Firebase app initialization
├── firebase-config-shared.ts    # Shared Firebase configuration
├── App.tsx                      # Main app component (updated to include FCM notifications)
└── ...
```

### Firebase Cloud Messaging

This app uses Firebase Cloud Messaging (FCM) for push notifications:

1. FCM tokens are automatically managed by Firebase
2. No VAPID keys required - Firebase handles everything
3. Send test notifications via Firebase Console
4. Use FCM tokens for programmatic notification sending

## Development

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Commands

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

## PWA Features

- Offline support with service worker caching
- App manifest for "Add to Home Screen" functionality
- Background push notifications
- Automatic app updates

## Browser Support

Push notifications require:

- HTTPS (or localhost for development)
- Modern browsers with Push API support
- User permission for notifications

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default tseslint.config({
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

- Replace `tseslint.configs.recommended` to `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`
- Optionally add `...tseslint.configs.stylisticTypeChecked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and update the config:

```js
// eslint.config.js
import react from 'eslint-plugin-react'

export default tseslint.config({
  // Set the react version
  settings: { react: { version: '18.3' } },
  plugins: {
    // Add the react plugin
    react,
  },
  rules: {
    // other rules...
    // Enable its recommended rules
    ...react.configs.recommended.rules,
    ...react.configs['jsx-runtime'].rules,
  },
})
```
