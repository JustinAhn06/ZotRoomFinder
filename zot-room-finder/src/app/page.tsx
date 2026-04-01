'use client';

import { useRouter } from 'next/navigation';
import Image from "next/image";
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  const handleFindRoom = () => {
    router.push('/search');
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Navbar */}
      <nav className="w-full bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#0064A4] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">Z</span>
            </div>
            <h1 className="text-2xl font-bold text-[#0064A4]">Zot Room Finder</h1>
          </div>
          <p className="text-sm text-gray-600">UCI Study Rooms</p>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <div className="max-w-2xl text-center space-y-8">
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
            Stop scavenging,{' '}
            <span className="text-[#0064A4]">start studying.</span>
          </h2>

          <p className="text-xl text-gray-600 leading-relaxed">
            Find available study rooms across UCI campus in seconds. No more checking multiple websites.
          </p>

          <Button
            size="lg"
            className="bg-[#0064A4] hover:bg-[#004A7A] text-white text-lg h-14 px-8 gap-2"
            onClick={handleFindRoom}
          >
            <Search className="w-5 h-5" />
            Find a Room
          </Button>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-200 mt-12">
            <div>
              <p className="text-2xl font-bold text-[#0064A4]">3</p>
              <p className="text-sm text-gray-600">Libraries</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#0064A4]">50+</p>
              <p className="text-sm text-gray-600">Study Rooms</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#0064A4]">&lt;2s</p>
              <p className="text-sm text-gray-600">Search Time</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6 text-center text-sm text-gray-600">
          <p>&copy; 2026 Zot Room Finder. Built for UCI students.</p>
        </div>
      </footer>
    </div>
  );
}
