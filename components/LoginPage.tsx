import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';

const StoreIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5A.75.75 0 0 1 14.25 12h.75c.414 0 .75.336.75.75v7.5m0 0H18A2.25 2.25 0 0 0 20.25 18v-7.5a2.25 2.25 0 0 0-2.25-2.25H15M13.5 21H3.75A2.25 2.25 0 0 1 1.5 18.75V8.25A2.25 2.25 0 0 1 3.75 6h16.5a2.25 2.25 0 0 1 2.25 2.25v7.5A2.25 2.25 0 0 1 18 21h-4.5m-4.5 0H9.75c-.414 0-.75-.336-.75-.75V13.5c0-.414.336-.75.75-.75h.75c.414 0 .75.336.75.75v7.5m0 0H12m0-9.75h.008v.008H12V11.25Z" />
  </svg>
);

const LockClosedIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
  </svg>
);

const UserIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
    </svg>
);

const LoginPage: React.FC = () => {
  const { login, isLoading, error: authError } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    if (!username.trim() || !password) {
        setLoginError('Vui lòng nhập tên đăng nhập và mật khẩu.');
        return;
    }
    
    const success = await login(username.trim(), password);
    if (!success) {
      setLoginError(useAuthStore.getState().error || 'Đăng nhập thất bại.');
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] flex text-gray-900 font-sans">
      {/* Left side - Branding/Image (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-amber-500 to-orange-700 p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-black opacity-10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex items-center gap-3 text-white">
          <StoreIcon className="h-10 w-10" />
          <span className="text-2xl font-bold tracking-wider">K-MTP FARM</span>
        </div>

        <div className="relative z-10 max-w-lg">
          <h1 className="text-4xl font-extrabold text-white leading-tight mb-6">
            Hệ thống Quản lý Vật tư Trại Gà Toàn diện
          </h1>
          <p className="text-amber-100 text-lg leading-relaxed">
            Kiểm soát kho bãi, theo dõi nhập xuất vật tư, và quản lý yêu cầu từ các khu vực một cách dễ dàng và chính xác.
          </p>
        </div>

        <div className="relative z-10 text-amber-200 text-sm">
          &copy; {new Date().getFullYear()} K-MTP. All rights reserved.
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col bg-gray-50 p-6 sm:p-12">
        <div className="flex-1 flex flex-col justify-start lg:justify-center items-center w-full pt-8 lg:pt-0">
          <div className="w-full max-w-md">
            <div className="lg:hidden mb-10 text-center">
              <StoreIcon className="mx-auto h-12 w-auto text-amber-600 mb-4" />
              <h2 className="text-3xl font-extrabold text-gray-900">
                Vật tư Trại Gà
              </h2>
            </div>

            <div className="bg-white shadow-xl rounded-2xl p-8 sm:p-10 border border-gray-100 relative">
              {isLoading && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-solid border-amber-500 border-t-transparent"></div>
                </div>
              )}
              
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Đăng nhập</h3>
                <p className="text-gray-500">Chào mừng trở lại! Vui lòng điền thông tin để tiếp tục.</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">Tên đăng nhập</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <UserIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </span>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      className="block w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 pl-12 text-gray-900 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-200 transition-colors"
                      placeholder="Nhập tên đăng nhập"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        if (loginError) setLoginError('');
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">Mật khẩu</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <LockClosedIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </span>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      className="block w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 pl-12 text-gray-900 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-200 transition-colors"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (loginError) setLoginError('');
                      }}
                    />
                  </div>
                </div>

                {loginError && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-start gap-2 border border-red-100">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0 mt-0.5">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                    <span>{loginError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-3.5 px-4 rounded-xl text-base font-semibold text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 transition-all shadow-md hover:shadow-lg mt-8"
                >
                  Đăng nhập vào hệ thống
                </button>
              </form>
            </div>
          </div>
        </div>
        
        <div className="mt-auto pt-8 pb-4 text-center text-sm text-gray-500 lg:hidden">
          &copy; {new Date().getFullYear()} K-MTP. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
