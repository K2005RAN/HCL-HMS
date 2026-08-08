import React from 'react';

interface PrintableFormHeaderProps {
    title: string;
    ruleSubtitle?: string;
    formNumber?: string;
    certificateNo?: string;
    companyName?: string;
    companyAddress?: string;
    companyContact?: string;
}

export const PrintableFormHeader: React.FC<PrintableFormHeaderProps> = ({
    title,
    ruleSubtitle,
    formNumber,
    certificateNo,
    companyName = 'HeidelbergCement India Ltd. (Unit Damoh)',
    companyAddress = 'Village and P.O. Narsingarh 470675, District – Damoh (MP)',
    companyContact = 'TEL.: +91-7601-241301, 02 & 05 | Fax - +91-7601-241235 | Website – www.mycemco.com',
}) => {
    return (
        <div className="w-full max-w-full box-border bg-white text-slate-900 border-b-2 border-slate-900 pb-3 mb-4 print:pb-2.5 print:mb-4">
            {/* Header Flex Container */}
            <div className="flex flex-row justify-between items-center border-b-2 border-emerald-800 pb-2.5 mb-2.5 w-full">
                <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-800 to-teal-900 text-white font-black text-2xl flex items-center justify-center rounded-xl shadow-sm print:shadow-none print:w-11 print:h-11 print:text-xl print:bg-emerald-900 shrink-0">
                        H
                    </div>
                    <div>
                        <h1 className="text-lg font-black tracking-tight text-slate-950 leading-tight print:text-base print:font-black">
                            {companyName}
                        </h1>
                        <p className="text-xs font-semibold text-slate-700 print:text-[11px] print:text-slate-800 mt-0.5">
                            {companyAddress}
                        </p>
                        <p className="text-[11px] text-slate-600 print:text-[10px] print:text-slate-700">
                            {companyContact}
                        </p>
                    </div>
                </div>
                {certificateNo && (
                    <div className="text-right border-l-2 border-emerald-700 pl-4 print:border-emerald-800 shrink-0">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-600 block print:text-slate-700">CERTIFICATE NO.</span>
                        <span className="font-mono font-black text-sm text-emerald-900 print:text-slate-950 print:text-base">{certificateNo}</span>
                    </div>
                )}
            </div>

            {/* Form Title */}
            <div className="text-center my-2">
                {formNumber && (
                    <span className="inline-block px-3 py-0.5 text-xs font-black uppercase tracking-widest bg-emerald-100 text-emerald-950 rounded-full mb-1 print:bg-emerald-100/80 print:px-2.5 print:py-0.5 print:rounded-md">
                        {formNumber}
                    </span>
                )}
                <h2 className="text-base font-black uppercase text-slate-950 tracking-wide print:text-sm print:font-black">
                    {title}
                </h2>
                {ruleSubtitle && (
                    <p className="text-xs italic text-slate-700 font-semibold mt-0.5 print:text-[11px] print:text-slate-800">
                        {ruleSubtitle}
                    </p>
                )}
            </div>
        </div>
    );
};



