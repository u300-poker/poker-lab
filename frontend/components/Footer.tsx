import React from 'react';
import { Github, Mail, Shield } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-black border-t border-zinc-900 pt-16 pb-8 mt-20">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent mb-4">
              PokerLab
            </h2>
            <p className="text-zinc-500 max-w-sm mb-6">
              데이터와 AI를 통해 당신의 포커 실력을 한 단계 높여드립니다. 
              영상을 올리고, 분석받고, 승률을 높이세요.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-zinc-600 hover:text-white transition-colors"><Github size={20} /></a>
              <a href="#" className="text-zinc-600 hover:text-white transition-colors"><Mail size={20} /></a>
            </div>
          </div>
          
          <div>
            <h3 className="text-white font-bold mb-4">서비스</h3>
            <ul className="space-y-2 text-zinc-500 text-sm">
              <li><a href="#" className="hover:text-blue-500 transition-colors">AI 코칭</a></li>
              <li><a href="#" className="hover:text-blue-500 transition-colors">세션 리포트</a></li>
              <li><a href="#" className="hover:text-blue-500 transition-colors">가격 정책</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4">법적 고지</h3>
            <ul className="space-y-2 text-zinc-500 text-sm">
              <li><a href="#" className="hover:text-blue-500 transition-colors">이용약관</a></li>
              <li><a href="#" className="hover:text-blue-500 transition-colors">개인정보처리방침</a></li>
              <li className="flex items-center gap-1 text-xs text-zinc-700 mt-4">
                <Shield size={12} /> RTA(실시간 보조) 금지 준수
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-zinc-900 pt-8 flex flex-col md:row justify-between items-center gap-4 text-zinc-600 text-xs">
          <p>© 2026 PokerLab. All rights reserved.</p>
          <p>포커랩은 건전한 포커 문화를 지향하며 불법 도박을 권장하지 않습니다.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;