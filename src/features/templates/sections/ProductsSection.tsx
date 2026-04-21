import React from 'react';
import { Business } from '../../../../types.ts';

interface ProductsSectionProps {
    business: Business;
}

const ProductsSection: React.FC<ProductsSectionProps> = ({ business }) => {
    const packages = business.products_packages || [];

    if (packages.length === 0) return null;

    return (
        <section className="py-24 px-4 md:px-20 bg-[#F2F2F2]">
            <div className="max-max-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-sm uppercase tracking-[0.4em] text-primary mb-4 font-semibold">Gói ưu đãi & Sản phẩm</h2>
                    <h3 className="text-4xl md:text-5xl font-serif text-neutral-dark">Trải nghiệm <span className="italic">trọn vẹn</span></h3>
                    <div className="w-24 h-px bg-primary mx-auto mt-6" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {packages.map((pkg: any, index: number) => (
                        <div
                            key={index}
                            className="bg-white p-10 rounded-sm shadow-sm border border-primary/5 hover:shadow-2xl transition-all duration-500 relative overflow-hidden group"
                        >
                            {pkg.is_popular && (
                                <div className="absolute top-0 right-0 bg-primary text-white text-[10px] px-4 py-1 uppercase tracking-widest font-bold rotate-45 translate-x-4 translate-y-2">
                                    Popular
                                </div>
                            )}
                            <h4 className="text-2xl font-serif text-neutral-dark mb-4">{pkg.name}</h4>
                            <div className="text-3xl font-serif text-primary mb-8">{pkg.price}</div>

                            <ul className="space-y-4 mb-10 text-neutral-dark/60 text-sm font-sans">
                                {pkg.features?.map((feature: string, i: number) => (
                                    <li key={i} className="flex items-center gap-3">
                                        <span className="text-primary">✓</span> {feature}
                                    </li>
                                ))}
                            </ul>

                            <button className="w-full py-4 text-xs font-bold uppercase tracking-widest border border-neutral-dark hover:bg-neutral-dark hover:text-white transition-all">
                                ĐĂNG KÝ GÓI
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ProductsSection;
