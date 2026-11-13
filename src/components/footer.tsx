import Image from "next/image";
import Link from "next/link";
export function Footer() {
  return (
    <footer className="bg-gray-900 dark:bg-gray-950 text-white py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-semibold">TicketPlatform</h3>
            </div>
            <p className="text-gray-400 dark:text-gray-500">
              Sua plataforma de confiança para compra e verificação de
              ingressos.
            </p>
          </div>

          <div>
            <h4 className="text-md font-semibold mb-4">Links Úteis</h4>
            <ul className="space-y-2 text-gray-400 dark:text-gray-500">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Termos de Uso
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Política de Privacidade
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Suporte
                </a>
              </li>
              <li>
                <Link href="/admin" className="hover:text-white transition-colors text-xs text-gray-500 hover:text-gray-300">
                  Área Administrativa
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-md font-semibold mb-4">Contato</h4>
            <ul className="space-y-2 text-gray-400 dark:text-gray-500">
              <li>Email: contato@ticketplatform.com</li>
              <li>Telefone: (71) 9999-9999</li>
              <li>WhatsApp: (11) 8888-8888</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 dark:border-gray-700 mt-8 pt-8 text-center text-gray-400 dark:text-gray-500">
          <div className="flex flex-row items-center justify-center gap-4 flex-nowrap">
            <Image
              width={100}
              height={100}
              src="/datasynk.svg"
              alt="Logo DataSynk"
              className="h-8 align-middle"
            />
            <p className="mb-0 align-middle whitespace-nowrap">
              &copy; 2025 Todos os direitos reservados a DataSynk.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
