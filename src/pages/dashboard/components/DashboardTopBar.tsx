import NotificationBell from "@/components/NotificationBell";
import UserMenu from "@/components/UserMenu";
import { RepeatIcon, Settings } from "lucide-react";
import { Link } from "react-router-dom";

export default function DashboardTopBar() {
  return (
    <div className="flex items-center justify-between">
      <span className="text-base font-bold text-gray-800 dark:text-gray-100 tracking-tight">
        finapp
      </span>
      <div className="flex items-center gap-1.5">
        <Link
          to="/recurring"
          className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-[#252523] hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          title="Transacciones recurrentes"
        >
          <RepeatIcon size={17} />
        </Link>
        <Link
          to="/settings"
          className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-[#252523] hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          title="Configuración"
        >
          <Settings size={17} />
        </Link>
        <NotificationBell />
        <UserMenu />
      </div>
    </div>
  );
}
