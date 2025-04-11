import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { PropostaForm } from '@/components/propostas/PropostaForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { createProposta } from '@/services/propostaService';
import type { PropostaCompleta } from '@/types/proposal';

const PropostaNova = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async (proposta: PropostaCompleta) => {
    setIsSubmitting(true);
    try {
      const propostaId = await createProposta(proposta);
      if (propostaId) {
        navigate('/propostas');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateProposal = async (proposta: PropostaCompleta) => {
    setIsSubmitting(true);
    try {
      const propostaId = await createProposta(proposta);
      if (propostaId) {
        // Aqui seria possível adicionar a lógica para gerar o PDF da proposta
        navigate('/propostas');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageLayout title="Nova Proposta">
      <div className="mb-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <PropostaForm 
            onSave={handleSave} 
            onGenerateProposal={handleGenerateProposal}
            isSubmitting={isSubmitting}
          />
        </CardContent>
      </Card>
    </PageLayout>
  );
};

export default PropostaNova; 