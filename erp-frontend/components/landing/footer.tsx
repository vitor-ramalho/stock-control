import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

export function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Company Info */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">E</span>
              </div>
              <span className="font-bold text-xl">Sistema ERP</span>
            </div>
            <p className="text-sm text-gray-600 max-w-md">
              Sistema ERP SaaS completo para gestão de estoque, vendas, caixa e PDV.
              Desenvolvido para pequenas e médias empresas que buscam eficiência.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Produto</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">
                  Funcionalidades
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="text-gray-600 hover:text-blue-600 transition-colors">
                  Preços
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                  Documentação
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                  API
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Empresa</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                  Sobre Nós
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                  Contato
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                  Carreiras
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-600">
          <p>© {currentYear} Sistema ERP. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-blue-600 transition-colors">
              Privacidade
            </Link>
            <Link href="#" className="hover:text-blue-600 transition-colors">
              Termos
            </Link>
            <Link href="#" className="hover:text-blue-600 transition-colors">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
