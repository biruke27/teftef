// [M0-T1] Telegram Mini App Shell — reads user name from initData
declare global {
  interface Window {
    Telegram: {
      WebApp: {
        ready: () => void;
        initDataUnsafe: {
          user?: { first_name: string; id: number; username?: string };
        };
      };
    };
  }
}

function App() {
  window.Telegram?.WebApp?.ready();

  const name =
    window.Telegram?.WebApp?.initDataUnsafe?.user?.first_name ?? 'there';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <div className="text-5xl mb-4">🇪🇹</div>
        <h1 className="text-2xl font-bold text-gray-900">
          Hello, {name}! 👋
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          TefTef — East Africa's Freelance Marketplace
        </p>
      </div>
    </div>
  );
}

export default App;
