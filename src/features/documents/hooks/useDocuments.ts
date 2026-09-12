import { useMemo, useCallback } from 'react';
import { TravelDocument } from '../types';
import { documentsService } from '../service';

export interface UseDocumentsProps {
  tripId: string;
  documents: TravelDocument[];
  onDocumentsUpdated?: (docs: TravelDocument[]) => void;
}

export function useDocuments({
  tripId,
  documents,
  onDocumentsUpdated,
}: UseDocumentsProps) {
  const normalizedDocs = useMemo(() => {
    return (documents || []).map(documentsService.normalize);
  }, [documents]);

  const saveDocument = useCallback(
    async (docData: Partial<TravelDocument>, newFiles: File[] = []) => {
      if (!tripId) return;
      const updated = await documentsService.saveDocument(
        tripId,
        normalizedDocs,
        docData,
        newFiles
      );
      onDocumentsUpdated?.(updated);
      return updated;
    },
    [tripId, normalizedDocs, onDocumentsUpdated]
  );

  const deleteDocument = useCallback(
    async (id: string | number) => {
      if (!tripId) return;
      const updated = await documentsService.deleteDocument(
        tripId,
        normalizedDocs,
        id
      );
      onDocumentsUpdated?.(updated);
      return updated;
    },
    [tripId, normalizedDocs, onDocumentsUpdated]
  );

  return {
    documents: normalizedDocs,
    saveDocument,
    deleteDocument,
  };
}
