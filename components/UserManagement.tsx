import React, { useState } from 'react';
import { User, Zone } from '../types';
import Pagination from './Pagination';

interface UserManagementProps {
  users: User[];
  zones: Zone[];
  onAddUser: (user: Omit<User, 'id'>) => Promise<void>;
  onUpdateUser: (id: string, user: Omit<User, 'id'>) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
  isReadOnly?: boolean;
}

const UserManagement: React.FC<UserManagementProps> = ({
  users, zones, onAddUser, onUpdateUser, onDeleteUser, isReadOnly
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  
  const totalPages = Math.ceil(users.length / ITEMS_PER_PAGE);
  const paginatedUsers = users.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'manager' | 'requester' | 'auditor'>('requester');
  const [zone, setZone] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const openModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setName(user.name);
      setUsername(user.username || '');
      setPassword(user.password || '');
      setRole(user.role as any);
      setZone(user.zone || (zones.length > 0 ? zones[0].name : ''));
    } else {
      setEditingUser(null);
      setName('');
      setUsername('');
      setPassword('');
      setRole('requester');
      setZone(zones.length > 0 ? zones[0].name : '');
    }
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !password) {
      alert("Vui lòng điền đầy đủ Tên, Tên đăng nhập và Mật khẩu.");
      return;
    }
    if (role === 'requester' && !zone) {
      alert("Người yêu cầu bắt buộc phải thuộc một khu vực.");
      return;
    }

    const userData: Omit<User, 'id'> = {
      name: name.trim(),
      username: username.trim(),
      password: password,
      role,
      zone: role === 'requester' ? zone : null as any
    };

    try {
      if (editingUser) {
        await onUpdateUser(editingUser.id, userData);
      } else {
        await onAddUser(userData);
      }
      setIsModalOpen(false);
    } catch (e: any) {
      alert("Lỗi: " + (e.message || "Không thể lưu thông tin tài khoản. Vui lòng thử lại."));
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa nhân viên này?")) {
      try {
        await onDeleteUser(id);
      } catch (e: any) {
        alert("Lỗi: " + (e.message || "Không thể xóa tài khoản."));
      }
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-white shadow rounded-lg p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Quản lý Tài khoản</h2>
          <p className="mt-1 text-sm text-gray-500">Thêm, sửa, xóa tài khoản và phân quyền cho nhân viên.</p>
        </div>
        {!isReadOnly && (
          <button onClick={() => openModal()} className="bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700 font-medium text-sm w-full sm:w-auto">
            + Thêm Tài khoản
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Họ và Tên</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên đăng nhập</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vai trò</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khu vực</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedUsers.map(user => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.username}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.role === 'manager' ? 'bg-purple-100 text-purple-800' : 
                    user.role === 'auditor' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {user.role === 'manager' ? 'Quản lý' : user.role === 'auditor' ? 'Người kiểm kê' : 'Người yêu cầu'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.zone || '—'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {!isReadOnly && (
                    <>
                      <button onClick={() => openModal(user)} className="text-amber-600 hover:text-amber-900 mr-4">Sửa</button>
                      <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-900">Xóa</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  Chưa có tài khoản nhân viên nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-auto pt-4 pb-4">
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setIsModalOpen(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    {editingUser ? 'Sửa thông tin tài khoản' : 'Thêm tài khoản mới'}
                  </h3>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Họ và Tên</label>
                      <input type="text" required value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm" placeholder="Nguyễn Văn A" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Tên đăng nhập</label>
                      <input type="text" required value={username} onChange={e => setUsername(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm" placeholder="nguyenvana" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
                      <div className="relative mt-1">
                        <input type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm" placeholder="Mật khẩu" />
                        <button type="button" className="absolute inset-y-0 right-0 px-3 flex items-center text-sm text-gray-500 hover:text-gray-700" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? "Ẩn" : "Hiện"}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Vai trò</label>
                      <select value={role} onChange={e => setRole(e.target.value as any)} className="mt-1 block w-full border border-gray-300 bg-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm">
                        <option value="requester">Người yêu cầu (Tạo phiếu)</option>
                        <option value="manager">Quản lý (Full quyền)</option>
                        <option value="auditor">Người kiểm kê (Chỉ xem)</option>
                      </select>
                    </div>
                    {role === 'requester' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Khu vực làm việc</label>
                        <select value={zone} onChange={e => setZone(e.target.value)} required className="mt-1 block w-full border border-gray-300 bg-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm">
                          <option value="" disabled>-- Chọn khu vực --</option>
                          {zones.map(z => (
                            <option key={z.id} value={z.name}>{z.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-amber-600 text-base font-medium text-white hover:bg-amber-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm">
                    Lưu thông tin
                  </button>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
