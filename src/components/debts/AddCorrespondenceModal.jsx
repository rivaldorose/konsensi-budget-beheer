import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, File, X, Loader2 } from 'lucide-react';
import { UploadPrivateFile } from '@/api/integrations';
import { PaymentDocument } from '@/api/entities';

const correspondenceTypes = {
  brief_verstuurd: 'Brief verstuurd',
  email_verstuurd: 'Email verstuurd',
  telefoongesprek: 'Telefoongesprek',
  aanmaning_ontvangen: 'Aanmaning ontvangen',
  email_ontvangen: 'Email ontvangen',
  reactie_schuldeiser: 'Reactie schuldeiser',
  voorstel_gedaan: 'Voorstel gedaan'
};

export default function AddCorrespondenceModal({ isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    type: 'brief_verstuurd',
    date: new Date().toISOString().split('T')[0],
    description: '',
    status: 'informatief'
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['application/pdf', 'message/rfc822', 'application/vnd.ms-outlook', 'image/jpeg', 'image/png', 'image/jpg'];
      const validExtensions = ['.pdf', '.eml', '.msg', '.jpg', '.jpeg', '.png'];
      
      const isValidType = validTypes.includes(file.type);
      const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
      
      if (!isValidType && !hasValidExtension) {
        alert('Alleen PDF, EML, MSG en afbeeldingen zijn toegestaan');
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
    if (!formData.description.trim()) {
      alert('Vul een beschrijving in');
      return;
    }

    setUploading(true);
    try {
      let uploadedFileData = null;

      if (selectedFile) {
        const { file_uri } = await UploadPrivateFile({ file: selectedFile });
        uploadedFileData = {
          file_uri,
          file_name: selectedFile.name,
          file_size: selectedFile.size
        };
      }

      await onSave({
        ...formData,
        uploadedFile: uploadedFileData
      });

      setFormData({
        type: 'brief_verstuurd',
        date: new Date().toISOString().split('T')[0],
        description: '',
        status: 'informatief'
      });
      setSelectedFile(null);
    } catch (error) {
      console.error('Error saving correspondence:', error);
      alert('Er ging iets fout bij het opslaan');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Correspondentie Toevoegen</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="type">Type</Label>
            <Select value={formData.type} onValueChange={v => handleChange('type', v)}>
              <SelectTrigger id="type">
                <SelectValue placeholder="Kies een type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(correspondenceTypes).map(([key, value]) => (
                  <SelectItem key={key} value={key}>{value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="date">Datum</Label>
            <Input 
              id="date" 
              type="date" 
              value={formData.date} 
              onChange={e => handleChange('date', e.target.value)} 
            />
          </div>
          <div>
            <Label htmlFor="description">Korte omschrijving</Label>
            <Textarea 
              id="description" 
              value={formData.description} 
              onChange={e => handleChange('description', e.target.value)} 
              placeholder="Bijv. 'Aanmaning ontvangen voor bedrag X' of 'Brief verstuurd met betalingsvoorstel'"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={v => handleChange('status', v)}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="informatief">Informatief</SelectItem>
                <SelectItem value="wacht_reactie">Wacht op reactie</SelectItem>
                <SelectItem value="akkoord">Akkoord ontvangen</SelectItem>
                <SelectItem value="afgewezen">Afgewezen</SelectItem>
                <SelectItem value="geen_reactie">Geen reactie ontvangen</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Document (optioneel)</Label>
            <div className="text-xs text-gray-500 mb-2">
              Upload een e-mail (.eml), PDF, of afbeelding van de correspondentie
            </div>
            
            {!selectedFile ? (
              <label htmlFor="file-upload-correspondence" className="cursor-pointer">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 transition-colors text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 font-medium">Klik of sleep bestand hierheen</p>
                  <p className="text-xs text-gray-500 mt-1">PDF, EML, MSG, of afbeelding (max 10MB)</p>
                </div>
                <input
                  type="file"
                  accept=".pdf,.eml,.msg,.png,.jpg,.jpeg,application/pdf,message/rfc822,application/vnd.ms-outlook,image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload-correspondence"
                />
              </label>
            ) : (
              <div className="border border-green-200 bg-green-50 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <File className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(0)} KB</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleRemoveFile}
                  className="h-8 w-8 text-gray-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={uploading}>
            Annuleren
          </Button>
          <Button onClick={handleSubmit} disabled={uploading}>
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Opslaan...
              </>
            ) : (
              'Opslaan'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}