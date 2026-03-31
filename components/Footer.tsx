import { BrainCircuit } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-black border-t border-white/10 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <BrainCircuit className="h-6 w-6 text-pink-500" />
              <span className="font-bold text-xl text-white tracking-tight">diyaa<span className="text-pink-500">.</span>ai</span>
            </div>
            <p className="text-gray-500 text-sm pr-4">
              Your autonomous digital workforce. Elevating human potential by taking over the mundane.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#features" className="hover:text-pink-400 transition-colors">Features</a></li>
              <li><a href="#capabilities" className="hover:text-pink-400 transition-colors">Capabilities</a></li>
              <li><a href="#pricing" className="hover:text-pink-400 transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-pink-400 transition-colors">Integrations</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#about" className="hover:text-pink-400 transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-pink-400 transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-pink-400 transition-colors">Contact Sales</a></li>
              <li><a href="#" className="hover:text-pink-400 transition-colors">Blog</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-pink-400 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-pink-400 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-pink-400 transition-colors">Security</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-600 text-sm">© 2026 Diyaa.ai. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="text-gray-600 hover:text-white transition-colors">Twitter</a>
            <a href="#" className="text-gray-600 hover:text-white transition-colors">LinkedIn</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
