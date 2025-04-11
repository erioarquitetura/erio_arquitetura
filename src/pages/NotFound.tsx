
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FileSearch } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: Tentativa de acesso à rota inexistente:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="text-center">
        <FileSearch className="h-20 w-20 mx-auto text-erio-500 mb-6" />
        <h1 className="text-4xl font-heading font-bold mb-4 text-gray-800 dark:text-gray-100">404</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">Oops! Página não encontrada</p>
        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
          A página que você está procurando não existe ou pode ter sido movida.
        </p>
        <Button className="bg-erio-500 hover:bg-erio-600" asChild>
          <a href="/">Voltar para o Dashboard</a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
