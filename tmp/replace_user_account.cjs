const fs = require('fs');

const filePath = 'c:/Users/Dell/Desktop/GITHUB CODE/Beauty-main/pages/UserAccountPage.tsx';

let content = fs.readFileSync(filePath, 'utf8');

// Use a RegExp to find the exact block and replace it regardless of spaces.
content = content.replace(/<p className="mt-1 text-lg text-neutral-dark">\{profile\?\.full_name \|\| 'Chưa cập nhật'\}<\/p>/g, `<p className="mt-1 text-lg text-neutral-dark">{profile?.full_name || currentUser?.user_metadata?.full_name || 'Chưa cập nhật'}</p>`);

const emailBlockContent = `<div>
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <p className="mt-1 text-lg text-neutral-dark">{profile?.email || currentUser?.email}</p>
                            </div>
                            <hr className="my-4" />
                            <div>
                                <label className="flex items-start space-x-3 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        defaultChecked={currentUser?.user_metadata?.receive_promotions !== false} 
                                        className="form-checkbox mt-1 h-5 w-5 text-primary rounded border-gray-300 focus:ring-primary" 
                                        onChange={async (e) => {
                                            import('../lib/supabaseClient.ts').then(({ supabase }) => {
                                                supabase.auth.updateUser({ data: { receive_promotions: e.target.checked }});
                                            });
                                        }}
                                    />
                                    <div>
                                        <span className="text-md font-medium text-gray-800">Nhận thông tin ưu đãi</span>
                                        <p className="text-sm text-gray-500">Đăng ký nhận email về các thông tin ưu đãi từ hệ thống 1Beauty.</p>
                                    </div>
                                </label>
                            </div>`;

content = content.replace(/<div>\s*<label className="block text-sm font-medium text-gray-700">Email<\/label>\s*<p className="mt-1 text-lg text-neutral-dark">\{profile\?\.email \|\| currentUser\?\.email\}<\/p>\s*<\/div>/g, emailBlockContent);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Update complete!');
