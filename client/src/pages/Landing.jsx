import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    // MAIN CONTAINER: Dark Industrial Theme with Blueprint Grid Background
    <div className="min-h-screen bg-slate-900 text-white overflow-hidden relative selection:bg-yellow-500 selection:text-black font-sans">
      
      {/* BACKGROUND GRAPHICS: Technical Grid & Glows */}
      <div className="absolute inset-0 z-0">
        {/* Blueprint Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        {/* Ambient Glows */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-yellow-500/10 rounded-full blur-[120px]"></div>
      </div>

      {/* STICKER ELEMENTS: Floating Construction Assets */}
      <div className="absolute top-20 right-10 md:right-20 text-9xl opacity-20 rotate-12 pointer-events-none z-0 animate-pulse">🏗️</div>
      <div className="absolute bottom-40 left-10 text-8xl opacity-20 -rotate-12 pointer-events-none z-0">🚧</div>
      
      {/* DECORATIVE CAUTION TAPE STRIP */}
      <div className="absolute top-0 left-0 w-full h-2 bg-yellow-500/80 shadow-[0_0_20px_rgba(234,179,8,0.5)]"></div>

      {/* HERO SECTION */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-6 pt-20">
        <div className="max-w-6xl w-full">
          
          {/* Badge */}
          <div className="inline-block mb-6 px-4 py-1 border border-yellow-500/30 rounded-full bg-yellow-500/10 backdrop-blur-md">
            <span className="text-yellow-400 text-sm font-mono tracking-widest uppercase">● Site Safety Compliant v2.0</span>
          </div>

          <h1 className="text-6xl md:text-9xl font-black mb-8 leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 drop-shadow-2xl">
            BUILD <span className="text-yellow-500 inline-block transform hover:-rotate-2 transition-transform duration-300">SAFER.</span><br />
            BUILD <span className="text-white">SMARTER.</span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-12 text-slate-300 max-w-3xl mx-auto font-light leading-relaxed border-l-4 border-yellow-500 pl-6 text-left md:text-center md:border-l-0 md:pl-0">
            The <span className="font-bold text-white">Quality Pulse</span> platform. 
            Daily quality assurance for high-performance sites. Secure. Real-Time. Compliant.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
            <Link 
              to="/register" 
              className="group relative bg-yellow-500 hover:bg-yellow-400 text-slate-900 text-xl font-bold px-12 py-5 rounded-sm skew-x-[-10deg] transition-all hover:scale-105 shadow-[0_0_40px_rgba(234,179,8,0.4)]"
            >
              <div className="skew-x-[10deg] flex items-center gap-2">
                🚀 LAUNCH APP
              </div>
            </Link>
            
            <Link 
              to="/login" 
              className="group relative px-12 py-5 rounded-sm border border-slate-600 bg-slate-800/50 backdrop-blur-sm text-xl font-bold transition-all hover:bg-slate-700 hover:border-white skew-x-[-10deg]"
            >
              <div className="skew-x-[10deg] flex items-center gap-2">
                LOGIN ACCESS <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* FEATURES SECTION: Blueprint Cards */}
      <div className="py-24 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-16 justify-center">
            <div className="h-px w-20 bg-slate-700"></div>
            <h2 className="text-4xl md:text-5xl font-bold text-white uppercase tracking-tight">Technical Specs</h2>
            <div className="h-px w-20 bg-slate-700"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group relative bg-slate-800/40 backdrop-blur-xl border border-slate-700 p-8 hover:border-yellow-500/50 transition-all duration-300 hover:-translate-y-2">
              <div className="absolute top-0 right-0 p-2 opacity-30 group-hover:opacity-100 transition-opacity">
                 <div className="w-3 h-3 bg-yellow-500 rounded-full animate-ping"></div>
              </div>
              <div className="text-6xl mb-6 bg-slate-900/50 w-20 h-20 flex items-center justify-center rounded-lg border border-slate-600 shadow-inner">
                📋
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white">Daily Reports</h3>
              <p className="text-slate-400">Streamlined QA inspections with high-res photo uploads and precise geolocation tagging.</p>
            </div>

            {/* Feature 2 */}
            <div className="group relative bg-slate-800/40 backdrop-blur-xl border border-slate-700 p-8 hover:border-blue-500/50 transition-all duration-300 hover:-translate-y-2">
              <div className="text-6xl mb-6 bg-slate-900/50 w-20 h-20 flex items-center justify-center rounded-lg border border-slate-600 shadow-inner">
                🔒
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white">Role-Based Access</h3>
              <p className="text-slate-400">Granular permissions for Admins, Engineers, and Viewers. Secure data hierarchy.</p>
            </div>

            {/* Feature 3 */}
            <div className="group relative bg-slate-800/40 backdrop-blur-xl border border-slate-700 p-8 hover:border-green-500/50 transition-all duration-300 hover:-translate-y-2">
              <div className="text-6xl mb-6 bg-slate-900/50 w-20 h-20 flex items-center justify-center rounded-lg border border-slate-600 shadow-inner">
                📊
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white">Site Analytics</h3>
              <p className="text-slate-400">Visual compliance trends, failure rate heatmaps, and one-click PDF/Excel exports.</p>
            </div>
          </div>
        </div>
      </div>

      {/* TESTIMONIALS: Site Notes Style */}
      <div className="py-24 px-6 relative z-10 bg-black/20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 text-white flex items-center justify-center gap-3">
            <span className="text-yellow-500">★</span> 
            FIELD APPROVED 
            <span className="text-yellow-500">★</span>
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Review 1 - Site Manager */}
            <div className="relative bg-[#fcf8e3] text-slate-900 p-8 shadow-xl transform rotate-[-2deg] hover:rotate-0 transition-transform duration-300">
               {/* Pin graphic */}
               <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-500 shadow-sm border border-red-700"></div>
              <p className="font-handwriting text-lg italic mb-4">"Reduced compliance issues by 40%. It's an essential tool for our daily operations."</p>
              <div className="border-t border-slate-300 pt-4 font-bold flex items-center gap-2">
                👷‍♂️ ABHISHEK, <span className="text-xs uppercase tracking-wider text-slate-500">Site Manager</span>
              </div>
            </div>

            {/* Review 2 - Engineer */}
            <div className="relative bg-slate-800 border-2 border-dashed border-slate-600 text-white p-8 shadow-xl transform rotate-[1deg] hover:rotate-0 transition-transform duration-300">
              <p className="text-lg mb-4 font-mono">"Real-time reports keep everyone on the same page. No more lost paperwork."</p>
              <div className="border-t border-slate-600 pt-4 font-bold flex items-center gap-2">
                📐 SHRADDHA, <span className="text-xs uppercase tracking-wider text-yellow-500">Engineer</span>
              </div>
            </div>

            {/* Review 3 - Admin */}
            <div className="relative bg-[#fcf8e3] text-slate-900 p-8 shadow-xl transform rotate-[3deg] hover:rotate-0 transition-transform duration-300">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-500 shadow-sm border border-red-700"></div>
              <p className="font-handwriting text-lg italic mb-4">"Easy to use, secure, and saves us roughly 10 hours weekly on admin tasks."</p>
              <div className="border-t border-slate-300 pt-4 font-bold flex items-center gap-2">
                🛡️ NIKHIL, <span className="text-xs uppercase tracking-wider text-slate-500">Admin</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER: Technical Footer */}
      <footer className="py-12 px-6 border-t border-slate-800 bg-black text-center relative overflow-hidden">
        {/* Decorative stripes in footer */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#fbbf24_10px,#fbbf24_20px)] opacity-20"></div>
        
        <div className="relative z-10 flex flex-col items-center gap-4">
           <div className="text-2xl font-bold tracking-tight text-white">THE QUALITY <span className="text-yellow-500">PULSE</span></div>
           <p className="text-slate-500 text-sm max-w-md mx-auto">
             Built for efficiency, safety, and modern engineering standards.
           </p>
           <p className="text-slate-600 text-xs mt-4 uppercase tracking-widest">
             &copy; 2025 The Quality Pulse. All Systems Nominal.
           </p>
        </div>
      </footer>
    </div>
  );
}