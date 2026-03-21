import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Server, 
  History as HistoryIcon, 
  Users, 
  MapPin, 
  Layers,
  Search,
  Bell
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Дашборд", icon: LayoutDashboard },
    { href: "/parts", label: "Каталог запчастей", icon: Server },
    { href: "/transactions", label: "Журнал операций", icon: HistoryIcon },
    { href: "/categories", label: "Категории", icon: Layers },
    { href: "/suppliers", label: "Поставщики", icon: Users },
    { href: "/warehouses", label: "Склады", icon: MapPin },
  ];

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-950 flex flex-col hidden md:flex flex-shrink-0 shadow-xl z-20">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <div className="flex items-center gap-2 text-white">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Server className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">Sklad.Pro</span>
          </div>
        </div>
        
        <nav className="flex-1 py-6 px-3 flex flex-col gap-1 overflow-y-auto">
          <div className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Управление
          </div>
          {navItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? "bg-blue-600/10 text-blue-400 font-medium" 
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-blue-500" : "text-slate-500"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2">
            <Avatar className="w-9 h-9 border border-slate-800">
              <AvatarFallback className="bg-slate-800 text-slate-300">AD</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-slate-200">Администратор</span>
              <span className="text-xs text-slate-500">admin@sklad.pro</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-md hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Глобальный поиск..." 
                className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-blue-500 rounded-full h-9"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
