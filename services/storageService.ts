/**
 * Supabase Storage Upload Service
 * Centraliza uploads de arquivos para os buckets do Supabase Storage.
 * 
 * Buckets disponíveis:
 *   - documents: PDFs, imagens de boletins, listas de frequência
 *   - evidences: Fotos de atividades, eventos
 *   - signatures: Assinaturas digitais (PNG/SVG)
 *   - laudos: Laudos médicos (PCD)
 */
import { supabase } from './supabaseClient';

export type StorageBucket = 'documents' | 'evidences' | 'signatures' | 'laudos';

interface UploadResult {
  url: string;
  path: string;
  error: string | null;
}

/**
 * Upload de arquivo para Supabase Storage
 * 
 * @param bucket - Nome do bucket ('documents', 'evidences', 'signatures', 'laudos')
 * @param file - Arquivo File ou Blob para upload
 * @param projectId - UUID do projeto (organiza em pastas)
 * @param subfolder - Subpasta opcional (ex: 'boletins', 'frequencia')
 * @returns { url, path, error }
 */
export async function uploadFile(
  bucket: StorageBucket,
  file: File | Blob,
  projectId: string,
  subfolder?: string,
): Promise<UploadResult> {
  try {
    // Gerar nome único para evitar colisões
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const ext = file instanceof File ? file.name.split('.').pop() || 'bin' : 'png';
    const sanitizedName = file instanceof File
      ? file.name.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 50)
      : `file_${random}`;
    
    // Montar path: {projectId}/{subfolder?}/{timestamp}_{nome}
    const pathParts = [projectId];
    if (subfolder) pathParts.push(subfolder);
    pathParts.push(`${timestamp}_${random}_${sanitizedName}`);
    const filePath = pathParts.join('/');

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || `application/${ext}`,
      });

    if (error) {
      console.error(`Storage upload error (${bucket}):`, error);
      return { url: '', path: '', error: error.message };
    }

    // Obter URL pública (signed ou pública dependendo do bucket)
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      url: urlData.publicUrl,
      path: data.path,
      error: null,
    };
  } catch (err: any) {
    console.error('Upload exception:', err);
    return { url: '', path: '', error: err.message || 'Erro desconhecido' };
  }
}

/**
 * Upload de assinatura base64 para o bucket "signatures"
 * Converte data:image/png;base64,... para Blob e faz upload
 */
export async function uploadSignature(
  base64Data: string,
  projectId: string,
  studentId: string,
  type: 'ficha' | 'uniformes' | 'prontidao' | 'responsavel',
): Promise<UploadResult> {
  try {
    // Se já é uma URL (não base64), retornar como está
    if (!base64Data.startsWith('data:')) {
      return { url: base64Data, path: '', error: null };
    }

    // Converter base64 para Blob
    const [header, b64] = base64Data.split(',');
    const mimeMatch = header.match(/data:([^;]+)/);
    const mime = mimeMatch?.[1] || 'image/png';
    const binary = atob(b64);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([array], { type: mime });
    const ext = mime === 'image/svg+xml' ? 'svg' : 'png';

    const fileName = `${studentId}_${type}.${ext}`;
    const filePath = `${projectId}/${fileName}`;

    // Upload (upsert para sobrescrever assinatura anterior)
    const { data, error } = await supabase.storage
      .from('signatures')
      .upload(filePath, blob, {
        cacheControl: '3600',
        upsert: true,
        contentType: mime,
      });

    if (error) {
      console.error('Signature upload error:', error);
      return { url: '', path: '', error: error.message };
    }

    const { data: urlData } = supabase.storage
      .from('signatures')
      .getPublicUrl(data.path);

    return {
      url: urlData.publicUrl,
      path: data.path,
      error: null,
    };
  } catch (err: any) {
    console.error('Signature upload exception:', err);
    return { url: '', path: '', error: err.message || 'Erro desconhecido' };
  }
}

/**
 * Gerar URL temporária (signed) para downloads seguros
 * Para buckets privados — gera link que expira em 1 hora
 */
export async function getSignedUrl(
  bucket: StorageBucket,
  path: string,
  expiresIn: number = 3600,
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    console.error('Signed URL error:', error);
    return null;
  }
  return data.signedUrl;
}

/**
 * Deletar arquivo do storage
 */
export async function deleteFile(
  bucket: StorageBucket,
  path: string,
): Promise<boolean> {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) {
    console.error('Delete file error:', error);
    return false;
  }
  return true;
}
