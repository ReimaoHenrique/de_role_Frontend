"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Home,
  Search,
  Settings,
  Github,
  ChevronDown,
  Download,
  UserPlus,
  User,
} from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import { usePwaInstall } from "@/lib/hooks/usePwaInstall";

const REPOSITORIES = [
  {
    label: "api-gateway",
    description: "BFF e rotas públicas",
    href: "https://github.com/ReimaoHenrique/de_role-api-gateway",
  },
  {
    label: "events-service",
    description: "Catálogo e reservas",
    href: "https://github.com/ReimaoHenrique/de_role-events-service",
  },
  {
    label: "tickets-service",
    description: "Ingressos e check-in",
    href: "https://github.com/ReimaoHenrique/de_role-tickets-service",
  },
  {
    label: "admin-service",
    description: "Autenticação e backoffice",
    href: "https://github.com/ReimaoHenrique/de_role-admin-service",
  },
];

export function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [reposOpen, setReposOpen] = useState(false);
  const { isInstalled, isIOS, installEvent, open } = usePwaInstall();
  const showInstallButton = !isInstalled && (Boolean(installEvent) || isIOS);
  return (
    <header className="border-b bg-background shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            {/* Logo do app no menu de navegação */}
            <Image
              src="/logo.png"
              alt="Ingressos"
              width={32}
              height={36}
              className="h-9 w-8 rounded-lg object-contain"
              priority
            />
            <span className="text-2xl font-bold text-foreground">
              TicketPlatform
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className="flex items-center space-x-1 text-muted-foreground hover:text-blue-600 transition-colors"
            >
              <Home className="h-4 w-4" />
              <span>Início</span>
            </Link>
            <Link
              href="/verificar"
              className="flex items-center space-x-1 text-muted-foreground hover:text-blue-600 transition-colors"
            >
              <Search className="h-4 w-4" />
              <span>Verificar Ingresso</span>
            </Link>
            <Link
              href="/cadastro"
              className="flex items-center space-x-1 text-muted-foreground hover:text-blue-600 transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              <span>Criar conta</span>
            </Link>
            <Link
              href="/perfil"
              className="flex items-center space-x-1 text-muted-foreground hover:text-blue-600 transition-colors"
            >
              <User className="h-4 w-4" />
              <span>Perfil</span>
            </Link>
            <div className="relative">
              <button
                type="button"
                onClick={() => setReposOpen((open) => !open)}
                aria-expanded={reposOpen}
                aria-haspopup="menu"
                className="flex items-center space-x-1 text-muted-foreground hover:text-blue-600 transition-colors"
              >
                <Github className="h-4 w-4" />
                <span>Repositórios</span>
                <ChevronDown
                  className={`h-3 w-3 transition-transform ${reposOpen ? "rotate-180" : ""}`}
                />
              </button>
              {reposOpen && (
                <div
                  role="menu"
                  className="absolute left-0 z-50 mt-2 w-60 rounded-md border bg-background p-1 shadow-lg"
                >
                  {REPOSITORIES.map((repo) => (
                    <a
                      key={repo.href}
                      href={repo.href}
                      target="_blank"
                      rel="noreferrer"
                      role="menuitem"
                      onClick={() => setReposOpen(false)}
                      className="flex flex-col rounded-sm px-3 py-2 text-sm hover:bg-muted"
                    >
                      <span className="font-medium">{repo.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {repo.description}
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </nav>

          <div className="flex items-center space-x-2">
            <ThemeToggle />
            {showInstallButton && (
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:inline-flex"
                onClick={open}
              >
                <Download className="h-4 w-4" />
                Instalar app
              </Button>
            )}
            <div className="md:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDrawerOpen(true)}
              >
                Menu
              </Button>
            </div>
          </div>
        </div>
      </div>
      {/* Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex">
          <div className="bg-background w-64 h-full shadow-lg p-6 flex flex-col gap-6 animate-slide-in-left">
            <button
              className="self-end mb-4 text-2xl"
              onClick={() => setDrawerOpen(false)}
            >
              &times;
            </button>
            <Link
              href="/"
              className="flex items-center space-x-2 text-muted-foreground hover:text-blue-600 transition-colors"
              onClick={() => setDrawerOpen(false)}
            >
              <Home className="h-4 w-4" />
              <span>Início</span>
            </Link>
            <Link
              href="/verificar"
              className="flex items-center space-x-2 text-muted-foreground hover:text-blue-600 transition-colors"
              onClick={() => setDrawerOpen(false)}
            >
              <Search className="h-4 w-4" />
              <span>Verificar Ingresso</span>
            </Link>
            <Link
              href="/cadastro"
              className="flex items-center space-x-2 text-muted-foreground hover:text-blue-600 transition-colors"
              onClick={() => setDrawerOpen(false)}
            >
              <UserPlus className="h-4 w-4" />
              <span>Criar conta</span>
            </Link>
            <Link
              href="/perfil"
              className="flex items-center space-x-2 text-muted-foreground hover:text-blue-600 transition-colors"
              onClick={() => setDrawerOpen(false)}
            >
              <User className="h-4 w-4" />
              <span>Perfil</span>
            </Link>
            <div className="flex flex-col gap-2 border-t pt-4">
              <span className="flex items-center space-x-2 text-sm font-medium">
                <Github className="h-4 w-4" />
                <span>Repositórios</span>
              </span>
              {REPOSITORIES.map((repo) => (
                <a
                  key={repo.href}
                  href={repo.href}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setDrawerOpen(false)}
                  className="flex flex-col rounded-sm px-2 py-1 text-sm text-muted-foreground hover:bg-muted hover:text-blue-600 transition-colors"
                >
                  <span className="font-medium">{repo.label}</span>
                  <span className="text-xs">{repo.description}</span>
                </a>
              ))}
            </div>
          </div>
          <div className="flex-1" onClick={() => setDrawerOpen(false)} />
        </div>
      )}
    </header>
  );
}
