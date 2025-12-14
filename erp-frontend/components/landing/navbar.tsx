'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">E</span>
          </div>
          <span className="font-bold text-xl hidden sm:inline-block">Sistema ERP</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <Link 
            href="#features" 
            className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
          >
            Funcionalidades
          </Link>
          <Link 
            href="#pricing" 
            className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
          >
            Preços
          </Link>
          <Link 
            href="#" 
            className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
          >
            Contato
          </Link>
        </div>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center space-x-4">
          <Link href="/login">
            <Button variant="ghost">Entrar</Button>
          </Link>
          <Link href="/register">
            <Button>Criar Conta</Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <div className="container mx-auto px-4 py-4 space-y-4">
            <Link
              href="#features"
              className="block text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Funcionalidades
            </Link>
            <Link
              href="#pricing"
              className="block text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Preços
            </Link>
            <Link
              href="#"
              className="block text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contato
            </Link>
            <div className="pt-4 space-y-2">
              <Link href="/login" className="block">
                <Button variant="outline" className="w-full">Entrar</Button>
              </Link>
              <Link href="/register" className="block">
                <Button className="w-full">Criar Conta</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
