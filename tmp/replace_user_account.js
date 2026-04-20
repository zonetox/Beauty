const fs = require('fs');

const filePath = 'c:/Users/Dell/Desktop/GITHUB CODE/Beauty-main/pages/UserAccountPage.tsx';

let content = fs.readFileSync(filePath, 'utf8');

const target1 = `<p className="mt-1 text-lg text-neutral-dark">{profile?.full_name || 'Chưa cập nhật'}</p>`;
const replacement1 = `<p className="mt-1 text-lg text-neutral-dark">{profile?.full_name || currentUser?.user_metadata?.full_name || 'Chưa cập nhật'}</p>`;

const target2 = `                            <div>\r
                                <label className="block text-sm font-medium text-gray-700">Email</label>\r
                                <p className="mt-1 text-lg text-neutral-dark">{profile?.email || currentUser?.email}</p>\r
                            </div>\r
                        </div>`;
const target2_LF = `                            <div>\n                                <label className="block text-sm font-medium text-gray-700">Email</label>\n                                <p className="mt-1 text-lg text-neutral-dark">{profile?.email || currentUser?.email}</p>\n                            </div>\n                        </div>`;

const replacement2 = `                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <p className="mt-1 text-lg text-neutral-dark">{profile?.email || currentUser?.email}</p>
                            </div>
                            <hr className="my-4 border-gray-200" />
                            <div>
                                <label className="flex items-start space-x-3 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        defaultChecked={currentUser?.user_metadata?.receive_promotions !== false} 
                                        className="mt-1 h-5 w-5 text-primary rounded border-gray-300 focus:ring-primary" 
                                        onChange={async (e) => {
                                            import('../lib/supabaseClient.ts').then(({ supabase }) => {
                                                supabase.auth.updateUser({ data: { receive_promotions: e.target.checked }});
                                            });
                                        }}
                                    />
                                    <div>
                                        <span className="text-md font-medium text-gray-800">Nhận thông tin ưu đãi</span>
                                        <p className="text-sm text-gray-500">Đăng ký nhận email về các ưu đãi mới nhất từ các doanh nghiệp trên hệ thống.</p>
                                    </div>
                                </label>
                            </div>
                        </div>`;

content = content.replace(target1, replacement1);
if (content.includes(target2)) {
    content = content.replace(target2, replacement2);
} else {
    content = content.replace(target2_LF, replacement2);
}

fs.writeFileSync(filePath, content, 'utf8');

console.log('Update complete!');
