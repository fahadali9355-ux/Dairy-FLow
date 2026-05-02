import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { format, subDays } from 'date-fns';
import { Download, Share2, Printer, CheckCircle } from 'lucide-react';
import html2pdf from 'html2pdf.js';

const Billing = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const billRef = useRef(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const { data } = await api.get('/customers');
        setCustomers(data);
        if (data.length > 0) setSelectedCustomer(data[0]._id);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCustomers();
  }, []);

  const generateBill = async () => {
    setLoading(true);
    setError('');
    setReport(null);
    try {
      const { data } = await api.get(`/billing/generate-slip?customerId=${selectedCustomer}&startDate=${startDate}&endDate=${endDate}`);
      setReport(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error generating bill');
    } finally {
      setLoading(false);
    }
  };

  const currentCustomer = customers.find(c => c._id === selectedCustomer);

  const handleDownloadPDF = async () => {
    const element = billRef.current;
    if (!element || !currentCustomer) return;
    
    try {
      const opt = {
        margin:       10,
        filename:     `Bill_${currentCustomer.name}_${format(new Date(), 'dd_MMM_yyyy')}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { 
          scale: 2,
          useCORS: true,
          logging: false,
          letterRendering: true,
          onclone: (clonedDoc) => {
            // ── Fix: Strip oklch() from all stylesheets ──
            // html2canvas parses raw CSS rules and crashes on oklch() (Tailwind v4).
            // We replace oklch(...) with a safe fallback in every stylesheet rule.
            const oklchRegex = /oklch\([^)]*\)/gi;
            const fallbackColor = '#6b7280'; // neutral gray fallback

            // 1. Rewrite all <style> tags in the cloned document
            const styleTags = clonedDoc.querySelectorAll('style');
            styleTags.forEach((styleTag) => {
              if (styleTag.textContent && oklchRegex.test(styleTag.textContent)) {
                styleTag.textContent = styleTag.textContent.replace(oklchRegex, fallbackColor);
              }
              // Reset regex lastIndex since we use the 'g' flag
              oklchRegex.lastIndex = 0;
            });

            // 2. Also rewrite any cssRules that might be in adopted stylesheets
            try {
              for (const sheet of clonedDoc.styleSheets) {
                try {
                  const rules = sheet.cssRules || sheet.rules;
                  if (!rules) continue;
                  for (let i = 0; i < rules.length; i++) {
                    const rule = rules[i];
                    if (rule.cssText && oklchRegex.test(rule.cssText)) {
                      const fixedCss = rule.cssText.replace(oklchRegex, fallbackColor);
                      try {
                        sheet.deleteRule(i);
                        sheet.insertRule(fixedCss, i);
                      } catch (_) {
                        // Some rules (like @import) can't be replaced, skip them
                      }
                    }
                    oklchRegex.lastIndex = 0;
                  }
                } catch (_) {
                  // Cross-origin stylesheets can't be accessed, skip them
                }
              }
            } catch (_) {
              // Fallback: if styleSheets API fails, we already handled <style> tags
            }

            // 3. Force standard colors on all elements as an extra safety net
            const elements = clonedDoc.getElementsByTagName('*');
            for (let i = 0; i < elements.length; i++) {
              const el = elements[i];
              if (el instanceof HTMLElement) {
                const computed = clonedDoc.defaultView
                  ? clonedDoc.defaultView.getComputedStyle(el)
                  : window.getComputedStyle(el);
                if (computed.color && computed.color.includes('oklch')) el.style.color = '#111827';
                if (computed.backgroundColor && computed.backgroundColor.includes('oklch')) el.style.backgroundColor = 'transparent';
                if (computed.borderColor && computed.borderColor.includes('oklch')) el.style.borderColor = '#e5e7eb';
                if (computed.outlineColor && computed.outlineColor.includes('oklch')) el.style.outlineColor = 'transparent';
              }
            }
          }
        },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error('PDF Generation Error:', err);
      alert('Could not generate PDF. Please try again.');
    }
  };

  const handleWhatsAppShare = () => {
    if (!report || !currentCustomer) {
      alert('Please generate the bill first.');
      return;
    }
    
    try {
      // Format message
      const { finalTotalKg, totalBillAmount, absentCount } = report.calculations;
      
      const message = `*DAIRYFLOW BILLING RECEIPT*\n\n` +
                      `*Name:* ${currentCustomer.name}\n` +
                      `*Period:* ${format(new Date(startDate), 'dd MMM')} to ${format(new Date(endDate), 'dd MMM')}\n\n` +
                      `*Total Milk:* ${finalTotalKg} Kg\n` +
                      `*Total Absents:* ${absentCount} days\n` +
                      `*Total Amount Due: Rs ${totalBillAmount.toLocaleString()}*\n\n` +
                      `Thank you for your business!`;

      const encodedMessage = encodeURIComponent(message);
      let phoneStr = (currentCustomer.phone || '').replace(/[^0-9]/g, '');
      
      if (!phoneStr) {
        alert('Customer phone number is missing.');
        return;
      }

      if (!phoneStr.startsWith('92')) {
        phoneStr = `92${phoneStr.replace(/^0/, '')}`;
      }
      
      const url = `https://wa.me/${phoneStr}?text=${encodedMessage}`;
      
      // Attempt window.open first, as it's the most common for WhatsApp redirects
      const newWindow = window.open(url, '_blank');
      if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
        // If window.open was blocked, fallback to direct location change
        window.location.href = url;
      }
    } catch (err) {
      console.error('WhatsApp Share Error:', err);
      alert('Could not open WhatsApp. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Generate Bill</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
            <select 
              className="input-field" 
              value={selectedCustomer} 
              onChange={e => setSelectedCustomer(e.target.value)}
            >
              {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input 
              type="date" 
              className="input-field" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input 
              type="date" 
              className="input-field" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)} 
            />
          </div>
          <div className="flex items-end">
            <button 
              onClick={generateBill} 
              disabled={loading || !selectedCustomer}
              className="btn-primary w-full"
            >
              {loading ? 'Calculating...' : 'Generate Bill'}
            </button>
          </div>
        </div>
      </div>

      {error && <div className="text-red-500 bg-red-50 p-4 rounded-xl border border-red-100">{error}</div>}

      {report && (
        <div className="flex items-start gap-6 flex-col lg:flex-row">
          
          {/* Actions & Summary Sidebar */}
          <div className="w-full lg:w-1/3 space-y-4">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold border-b pb-2 mb-4">Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Milk ({report.period.totalDays} days)</span>
                  <span className="font-semibold">{report.calculations.baseMilk} Kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Extra Milk (+)</span>
                  <span className="font-semibold text-blue-600">+{report.calculations.extraMilkSum} Kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Absents ({report.calculations.absentCount})</span>
                  <span className="font-semibold text-red-500">-{report.calculations.deductedMilk} Kg</span>
                </div>
                <div className="border-t pt-3 flex justify-between mt-2">
                  <span className="text-gray-900 font-bold">Net Payable</span>
                  <span className="font-bold text-primary-600 text-lg">Rs {report.calculations.totalBillAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <button onClick={handleDownloadPDF} className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg flex items-center justify-center hover:bg-gray-800 transition">
              <Download className="w-5 h-5 mr-2" /> Download PDF
            </button>
            <button onClick={handleWhatsAppShare} className="w-full px-4 py-3 bg-[#25D366] text-white rounded-lg flex items-center justify-center hover:bg-[#20b858] transition">
              <Share2 className="w-5 h-5 mr-2" /> Share via WhatsApp
            </button>
          </div>

          {/* Printable Preview */}
          <div className="flex-1 w-full bg-gray-200 p-4 md:p-8 rounded-xl overflow-x-auto">
            <div className="bg-white mx-auto shadow-sm min-w-[600px] p-8 printable-bill" ref={billRef} style={{ backgroundColor: '#ffffff', color: '#111827' }}>
              <div className="border-b-2 pb-6 mb-6 flex justify-between items-end" style={{ borderColor: '#1f2937' }}>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight" style={{ color: '#111827' }}>INVOICE</h1>
                  <p className="mt-2" style={{ color: '#6b7280' }}>DairyFlow Management</p>
                </div>
                <div className="text-right">
                  <h2 className="text-xl font-bold" style={{ color: '#111827' }}>{currentCustomer?.name}</h2>
                  <p style={{ color: '#4b5563' }}>{currentCustomer?.phone}</p>
                </div>
              </div>

              <div className="flex justify-between mb-8 text-sm">
                <div>
                  <span className="block mb-1" style={{ color: '#6b7280' }}>Period</span>
                  <span className="font-semibold" style={{ color: '#111827' }}>{format(new Date(startDate), 'dd MMM yyyy')} — {format(new Date(endDate), 'dd MMM yyyy')}</span>
                  <span className="ml-2" style={{ color: '#9ca3af' }}>({report.period.totalDays} Days)</span>
                </div>
                <div className="text-right border-l-2 pl-6" style={{ borderColor: '#e5e7eb' }}>
                  <span className="block mb-1" style={{ color: '#6b7280' }}>Total Amount Due</span>
                  <span className="text-2xl font-bold" style={{ color: '#111827' }}>Rs {report.calculations.totalBillAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8">
                <div className="p-4 rounded-lg" style={{ backgroundColor: '#f9fafb' }}>
                  <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#9ca3af' }}>Milk Consumption</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span style={{ color: '#4b5563' }}>Base Milk ({report.period.totalDays} Days)</span>
                      <span className="font-bold" style={{ color: '#111827' }}>{report.calculations.baseMilk} Kg</span>
                    </div>
                    <div className="flex justify-between" style={{ color: '#2563eb' }}>
                      <span>Extra Milk Added</span>
                      <span className="font-bold">+{report.calculations.extraMilkSum} Kg</span>
                    </div>
                    <div className="flex justify-between" style={{ color: '#dc2626' }}>
                      <span>Deducted (Absents: {report.calculations.absentCount})</span>
                      <span className="font-bold">-{report.calculations.deductedMilk} Kg</span>
                    </div>
                    <div className="border-t pt-2 mt-2 flex justify-between font-black" style={{ borderTopColor: '#e5e7eb', color: '#111827' }}>
                      <span>Final Total</span>
                      <span>{report.calculations.finalTotalKg} Kg</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-lg" style={{ backgroundColor: '#f9fafb' }}>
                  <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#9ca3af' }}>Billing Details</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span style={{ color: '#4b5563' }}>Net Milk</span>
                      <span className="font-bold" style={{ color: '#111827' }}>{report.calculations.finalTotalKg} Kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: '#4b5563' }}>Your Rate</span>
                      <span className="font-bold" style={{ color: '#111827' }}>Rs {report.calculations.ratePerKg} / Kg</span>
                    </div>
                    <div className="border-t pt-2 mt-2 flex justify-between font-black text-lg" style={{ borderTopColor: '#e5e7eb', color: '#10b981' }}>
                      <span>Total Bill</span>
                      <span>Rs {report.calculations.totalBillAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-between items-center text-sm border-t pt-8" style={{ borderTopColor: '#e5e7eb', color: '#6b7280' }}>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2" style={{ color: '#10b981' }} />
                  Generated via DairyFlow PWA
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default Billing;
