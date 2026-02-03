import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, X, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const documentTypes = {
  aanmaning: 'Aanmaning',
  factuur: 'Factuur',
  overeenkomst: 'Overeenkomst',
  vonnis: 'Vonnis',
  dagvaarding: 'Dagvaarding',
  betalingsbewijs: 'Betalingsbewijs',
  brief_schuldeiser: 'Brief van schuldeiser',
  brief_deurwaarder: 'Brief van deurwaarder',
  bankafschrift: 'Bankafschrift',
  overig: 'Overig'
};

export default function AddDocumentModal({ isOpen, onClose, onSave }) {
  const [documentType, setDocumentType] = useState('overig');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validExtensions = ['.pdf', '.eml', '.msg', '.jpg', '.jpeg', '.png', '.doc', '.docx'];
      const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

      if (!hasValidExtension) {
        alert('Alleen PDF, EML, MSG, Word-documenten en afbeeldingen zijn toegestaan');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        alert('Bestand is te groot (max 10MB)');
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      alert('Selecteer een bestand om te uploaden');
      return;
    }

    setUploading(true);
    try {
      const fileName = `documents/${Date.now()}-${selectedFile.name}`;
      const { data, error } = await supabase.storage
        .from('attachments')
        .upload(fileName, selectedFile);

      if (error) throw error;

      const { data: urlData } = supabase.storage.from('attachments').getPublicUrl(data.path);

      await onSave({
        document_type: documentType,
        file_name: selectedFile.name,
        file_uri: urlData?.publicUrl || data.path,
        file_size: selectedFile.size
      });

      setDocumentType('overig');
      setSelectedFile(null);
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Er ging iets fout bij het uploaden');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-dark-card border-gray-200 dark:border-dark-border">
        <DialogHeader>
          <DialogTitle className="text-text-main dark:text-text-primary">Document Toevoegen</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label className="text-text-main dark:text-text-primary">Type document</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger className="bg-gray-50 dark:bg-dark-card-elevated border-gray-200 dark:border-dark-border-accent text-text-main dark:text-text-primary">
                <SelectValue placeholder="Kies een type" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-dark-card border-gray-200 dark:border-dark-border">
                {Object.entries(documentTypes).map(([key, value]) => (
                  <SelectItem key={key} value={key}>{value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-text-main dark:text-text-primary">Bestand</Label>
            <p className="text-xs text-text-muted dark:text-text-tertiary">
              Upload een PDF, Word-document, e-mail of afbeelding
            </p>

            {!selectedFile ? (
              <label htmlFor="file-upload-document" className="cursor-pointer block">
                <div className="border-2 border-dashed border-gray-300 dark:border-dark-border-accent rounded-xl p-5 hover:border-primary dark:hover:border-primary-green transition-colors text-center group">
                  <Upload className="w-8 h-8 text-text-muted dark:text-text-tertiary mx-auto mb-2 group-hover:text-primary dark:group-hover:text-primary-green transition-colors" />
                  <p className="text-sm text-text-main dark:text-text-primary font-medium">Klik om bestand te uploaden</p>
                  <p className="text-xs text-text-muted dark:text-text-tertiary mt-1">PDF, EML, MSG, DOC, DOCX of afbeelding (max 10MB)</p>
                </div>
                <input
                  type="file"
                  accept=".pdf,.eml,.msg,.png,.jpg,.jpeg,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload-document"
                />
              </label>
            ) : (
              <div className="border border-emerald-200 dark:border-primary-green/30 bg-emerald-50 dark:bg-primary-green/10 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-5 h-5 text-primary dark:text-primary-green flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-main dark:text-text-primary truncate">{selectedFile.name}</p>
                    <p className="text-xs text-text-muted dark:text-text-tertiary">{(selectedFile.size / 1024).toFixed(0)} KB</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleRemoveFile}
                  className="h-8 w-8 text-text-muted dark:text-text-tertiary hover:text-status-red dark:hover:text-accent-red flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={uploading}
            className="border-gray-200 dark:border-dark-border text-text-main dark:text-text-primary hover:bg-gray-50 dark:hover:bg-dark-card-elevated"
          >
            Annuleren
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={uploading || !selectedFile}
            className="bg-primary dark:bg-primary-green text-white dark:text-dark-bg hover:bg-primary-dark dark:hover:bg-light-green font-semibold"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploaden...
              </>
            ) : (
              'Uploaden'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
