import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Wallet, ShoppingCart, Users, ArrowRight, CheckCircle2 } from 'lucide-react';
import { LandingNavbar } from '@/components/landing/navbar';
import { LandingFooter } from '@/components/landing/footer';

export const metadata: Metadata = {
  title: 'Sistema ERP SaaS | Gestão Completa para seu Negócio',
  description: 'Sistema ERP multi-tenant completo para pequenas e médias empresas. Gerencie estoque, vendas, caixa e PDV em uma única plataforma.',
  keywords: ['ERP', 'SaaS', 'Gestão', 'Estoque', 'PDV', 'Vendas', 'Multi-tenant'],
};

const features = [
  {
    icon: Package,
    title: 'Controle de Estoque',
    description: 'Gerencie produtos, categorias e movimentações de estoque em tempo real com alertas de estoque baixo.',
  },
  {
    icon: Wallet,
    title: 'Gestão Financeira',
    description: 'Controle completo de caixa com abertura/fechamento de sessões e lançamentos financeiros detalhados.',
  },
  {
    icon: ShoppingCart,
    title: 'PDV Completo',
    description: 'Sistema de ponto de venda rápido e intuitivo com suporte a múltiplos métodos de pagamento.',
  },
  {
    icon: Users,
    title: 'Multi-Tenant',
    description: 'Arquitetura SaaS com isolamento completo de dados por empresa. Seguro, escalável e confiável.',
  },
];

const benefits = [
  'Interface moderna e intuitiva',
  'Relatórios em tempo real',
  'Suporte a código de barras',
  'Gestão de múltiplos usuários',
  'Backup automático de dados',
  'Atualizações constantes',
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <LandingNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white pt-24 pb-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl md:text-7xl">
              Gerencie Estoque, Caixa, Vendas & PDV —{' '}
              <span className="text-blue-600">Tudo em Um ERP SaaS</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 sm:text-xl">
              Um poderoso sistema ERP multi-tenant para pequenas e médias empresas.
              Simplifique sua gestão e impulsione seus resultados.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="text-lg px-8 py-6 w-full sm:w-auto">
                  Criar Sua Conta
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 w-full sm:w-auto">
                  Fazer Login
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-sm text-gray-500">
              Teste grátis por 14 dias • Sem cartão de crédito
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Funcionalidades Completas
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Tudo que você precisa para gerenciar seu negócio em uma única plataforma
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="border-2 hover:border-blue-200 transition-colors">
                  <CardHeader>
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                Por que escolher nosso ERP?
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Desenvolvido pensando na sua experiência e produtividade
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-center gap-3 bg-white p-4 rounded-lg border">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Planos e Preços
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Escolha o plano ideal para o seu negócio
            </p>
          </div>

          <div className="mx-auto max-w-5xl grid gap-8 lg:grid-cols-3">
            {/* Starter Plan */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-2xl">Básico</CardTitle>
                <CardDescription>Para pequenos negócios</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">R$ 99</span>
                  <span className="text-gray-600">/mês</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Até 1.000 produtos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>2 usuários</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Suporte por email</span>
                  </li>
                </ul>
                <Button className="w-full" variant="outline">Em Breve</Button>
              </CardContent>
            </Card>

            {/* Professional Plan */}
            <Card className="border-2 border-blue-600 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Mais Popular
                </span>
              </div>
              <CardHeader>
                <CardTitle className="text-2xl">Profissional</CardTitle>
                <CardDescription>Para empresas em crescimento</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">R$ 199</span>
                  <span className="text-gray-600">/mês</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Produtos ilimitados</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>5 usuários</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Suporte prioritário</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Relatórios avançados</span>
                  </li>
                </ul>
                <Button className="w-full" variant="default">Em Breve</Button>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-2xl">Enterprise</CardTitle>
                <CardDescription>Para grandes operações</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">Customizado</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Tudo do Profissional</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Usuários ilimitados</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Suporte 24/7</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Integrações customizadas</span>
                  </li>
                </ul>
                <Button className="w-full" variant="outline">Fale Conosco</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Pronto para transformar sua gestão?
          </h2>
          <p className="mt-4 text-lg text-blue-100">
            Comece agora mesmo e veja a diferença em seu negócio
          </p>
          <div className="mt-8">
            <Link href="/register">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                Criar Conta Gratuita
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
