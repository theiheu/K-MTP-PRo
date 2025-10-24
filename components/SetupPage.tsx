import React, { useState } from 'react';
import { User } from '../types';

interface SetupPageProps {
  onSetup: (user: User) => void;
}

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


const SetupPage: React.FC<SetupPageProps> = ({ onSetup }) => {
  const [name, setName] = useState('');
  const [zone, setZone] = useState('Khu 1');
  const [managerPassword, setManagerPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleRequesterSetup = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() === '') {
      alert('Vui lòng nhập tên của bạn.');
      return;
    }
    onSetup({ name: name.trim(), role: 'requester', zone });
  };

  const handleManagerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Dành cho mục đích trình diễn, mật khẩu là 'admin123'. Trong ứng dụng thực tế, hãy sử dụng hệ thống xác thực an toàn.
    if (managerPassword === 'admin123') {
      setPasswordError('');
      onSetup({ name: 'Quản lý Kho', role: 'manager' });
    } else {
      setPasswordError('Mật khẩu không đúng. Vui lòng thử lại.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
            <StoreIcon className="mx-auto h-12 w-auto text-indigo-600" />
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
                Thiết lập Hệ thống Vật tư
            </h2>
            <p className="mt-2 text-sm text-gray-600">
                Thiết lập thông tin của bạn một lần để bắt đầu
            </p>
        </div>

        <div className="bg-white shadow-lg rounded-lg p-8 space-y-6">
            <div>
                <h3 className="text-lg font-medium text-gray-800">Bạn là Người Yêu Cầu?</h3>
                <form onSubmit={handleRequesterSetup} className="mt-4 space-y-4">
                    <div>
                        <label htmlFor="name" className="sr-only">Tên của bạn</label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            required
                            className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                            placeholder="Nhập tên của bạn"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                     <div>
                        <label htmlFor="zone" className="sr-only">Khu vực chính</label>
                        <select
                            id="zone"
                            name="zone"
                            value={zone}
                            onChange={(e) => setZone(e.target.value)}
                            className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                        >
                            <option>Khu 1</option>
                            <option>Khu 2</option>
                            <option>Khu 3</option>
                            <option>Khu 4</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        Lưu và Bắt đầu
                    </button>
                </form>
            </div>
            
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-2 text-gray-500">hoặc</span>
                </div>
            </div>

            <div>
                 <h3 className="text-lg font-medium text-gray-800">Bạn là Quản lý?</h3>
                 <form onSubmit={handleManagerLogin} className="mt-4 space-y-4">
                    <div>
                        <label htmlFor="manager-password" className="sr-only">Mật khẩu</label>
                         <div className="relative">
                            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <LockClosedIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                            </span>
                            <input
                                id="manager-password"
                                name="password"
                                type="password"
                                required
                                className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 pl-10 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                                placeholder="Mật khẩu"
                                value={managerPassword}
                                onChange={(e) => {
                                    setManagerPassword(e.target.value);
                                    if (passwordError) setPasswordError(''); // Xóa lỗi khi người dùng nhập lại
                                }}
                            />
                        </div>
                    </div>
                    {passwordError && <p className="text-xs text-red-600">{passwordError}</p>}
                    <button
                        type="submit"
                        className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-700 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                        >
                        Đăng nhập với vai trò Quản lý
                    </button>
                 </form>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SetupPage;