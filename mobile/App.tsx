import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import { supabase } from './src/supabase';
import { createProject, getSignedOutput, listProjects, startRender, type MobileProject } from './src/api';
import { uploadVideo } from './src/upload';

type Format = '9:16' | '1:1' | '16:9';

const formats: Format[] = ['9:16', '1:1', '16:9'];

export default function App() {
  const [sessionReady, setSessionReady] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [projects, setProjects] = useState<MobileProject[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<Format>('9:16');
  const [projectName, setProjectName] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setUserEmail(data.session?.user.email ?? null);
      setSessionReady(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setUserEmail(nextSession?.user.email ?? null);
      setSessionReady(true);
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!userEmail) return;
    refreshProjects();
  }, [userEmail]);

  const selectedDuration = useMemo(() => {
    if (!selectedVideo?.duration) return 60;
    return Math.max(0.1, selectedVideo.duration / 1000);
  }, [selectedVideo]);

  async function refreshProjects() {
    try {
      const result = await listProjects();
      setProjects(result.projects);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Gagal memuat project.');
    }
  }

  async function authenticate(mode: 'login' | 'signup') {
    setBusy(true);
    setStatus('');
    try {
      const result = mode === 'login'
        ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
        : await supabase.auth.signUp({ email: email.trim(), password });
      if (result.error) throw result.error;
      if (mode === 'signup' && !result.data.session) {
        setStatus('Akun dibuat. Cek email untuk konfirmasi jika diminta.');
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Autentikasi gagal.');
    } finally {
      setBusy(false);
    }
  }

  async function pickVideo() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsMultipleSelection: false,
      quality: 1,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      if (asset) {
        setSelectedVideo(asset);
        if (!projectName) setProjectName(asset.fileName?.replace(/\.[^/.]+$/, '') ?? 'Untitled clip');
      }
    }
  }

  async function uploadAndCreateProject() {
    if (!selectedVideo?.uri) return;
    setBusy(true);
    setUploadProgress(0);
    setStatus('Mengunggah video 0%...');
    try {
      const path = await uploadVideo(selectedVideo, (percent) => {
        setUploadProgress(percent);
        setStatus(`Mengunggah video ${percent}%...`);
      });

      setStatus('Membuat project...');
      await createProject({
        name: projectName.trim() || 'Untitled clip',
        original_filename: selectedVideo.fileName ?? 'clip.mp4',
        source_path: path,
        format: selectedFormat,
        start_seconds: 0,
        end_seconds: Math.min(selectedDuration, 600),
      });
      setSelectedVideo(null);
      setProjectName('');
      setUploadProgress(100);
      setStatus('Project berhasil dibuat.');
      await refreshProjects();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Gagal membuat project.');
    } finally {
      setBusy(false);
    }
  }

  async function render(projectId: string) {
    setBusy(true);
    try {
      await startRender(projectId);
      setStatus('Render dimulai.');
      await refreshProjects();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Render gagal dimulai.');
    } finally {
      setBusy(false);
    }
  }

  async function shareOutput(projectId: string) {
    try {
      const { url } = await getSignedOutput(projectId);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(url);
      } else {
        Alert.alert('Video siap', url);
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Output belum tersedia.');
    }
  }

  if (!sessionReady) {
    return <SafeAreaView style={styles.center}><ActivityIndicator /></SafeAreaView>;
  }

  if (!userEmail) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.authCard}>
          <Text style={styles.brand}>ClippNow</Text>
          <Text style={styles.subtitle}>Buat short video lebih cepat.</Text>
          <TextInput value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor="#6b7280" autoCapitalize="none" keyboardType="email-address" style={styles.input} />
          <TextInput value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor="#6b7280" secureTextEntry style={styles.input} />
          <Pressable disabled={busy} onPress={() => authenticate('login')} style={styles.primary}><Text style={styles.primaryText}>{busy ? 'Memproses...' : 'Masuk'}</Text></Pressable>
          <Pressable disabled={busy} onPress={() => authenticate('signup')} style={styles.secondary}><Text style={styles.secondaryText}>Buat akun</Text></Pressable>
          {!!status && <Text style={styles.status}>{status}</Text>}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <View><Text style={styles.brand}>ClippNow</Text><Text style={styles.subtitle}>{userEmail}</Text></View>
          <Pressable onPress={() => supabase.auth.signOut()}><Text style={styles.link}>Keluar</Text></Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Buat clip</Text>
          <Pressable onPress={pickVideo} style={styles.picker}><Text style={styles.pickerText}>{selectedVideo ? selectedVideo.fileName ?? 'Video dipilih' : 'Pilih video dari galeri'}</Text></Pressable>
          <TextInput value={projectName} onChangeText={setProjectName} placeholder="Nama project" placeholderTextColor="#6b7280" style={styles.input} />
          <Text style={styles.label}>Format</Text>
          <View style={styles.formatRow}>{formats.map((format) => <Pressable key={format} onPress={() => setSelectedFormat(format)} style={[styles.format, selectedFormat === format && styles.formatActive]}><Text style={[styles.formatText, selectedFormat === format && styles.formatTextActive]}>{format}</Text></Pressable>)}</View>
          {busy && uploadProgress > 0 && uploadProgress < 100 && <View style={styles.progressTrack}><View style={[styles.progressBar, { width: `${uploadProgress}%` }]} /></View>}
          <Pressable disabled={busy || !selectedVideo} onPress={uploadAndCreateProject} style={[styles.primary, (!selectedVideo || busy) && styles.disabled]}><Text style={styles.primaryText}>{busy ? 'Memproses...' : 'Upload & buat project'}</Text></Pressable>
        </View>

        <View style={styles.card}>
          <View style={styles.headerRow}><Text style={styles.sectionTitle}>Project saya</Text><Pressable onPress={refreshProjects}><Text style={styles.link}>Refresh</Text></Pressable></View>
          {projects.length === 0 ? <Text style={styles.muted}>Belum ada project.</Text> : projects.map(({ project, job }) => (
            <View key={project.id} style={styles.project}>
              <View style={{ flex: 1 }}><Text style={styles.projectTitle}>{project.name}</Text><Text style={styles.muted}>{project.format} · {job?.status ?? project.status} · {job?.progress ?? 0}%</Text></View>
              {job?.status === 'queued' && <Pressable onPress={() => render(project.id)} style={styles.smallButton}><Text style={styles.smallButtonText}>Render</Text></Pressable>}
              {job?.status === 'processing' && <ActivityIndicator />}
              {job?.status === 'completed' && <Pressable onPress={() => shareOutput(project.id)} style={styles.smallButton}><Text style={styles.smallButtonText}>Share</Text></Pressable>}
            </View>
          ))}
        </View>
        {!!status && <Text style={styles.status}>{status}</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: 20, gap: 16 },
  authCard: { margin: 20, marginTop: 100, padding: 24, borderRadius: 24, backgroundColor: '#fff', gap: 12, elevation: 2 },
  brand: { fontSize: 32, fontWeight: '800', color: '#111827' },
  subtitle: { color: '#6b7280', marginTop: 2 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 18, gap: 12, elevation: 1 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  input: { backgroundColor: '#f1f5f9', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: '#111827' },
  picker: { borderWidth: 1, borderStyle: 'dashed', borderColor: '#94a3b8', borderRadius: 14, padding: 20, alignItems: 'center' },
  pickerText: { color: '#334155', fontWeight: '600' },
  label: { color: '#475569', fontWeight: '700' },
  formatRow: { flexDirection: 'row', gap: 8 },
  format: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: '#e2e8f0' },
  formatActive: { backgroundColor: '#111827' },
  formatText: { color: '#334155', fontWeight: '700' },
  formatTextActive: { color: '#fff' },
  primary: { backgroundColor: '#111827', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: '800' },
  secondary: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  secondaryText: { color: '#111827', fontWeight: '800' },
  disabled: { opacity: 0.45 },
  link: { color: '#2563eb', fontWeight: '700' },
  status: { color: '#475569', textAlign: 'center' },
  muted: { color: '#64748b' },
  progressTrack: { height: 8, backgroundColor: '#e2e8f0', borderRadius: 999, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: '#111827' },
  project: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  projectTitle: { fontWeight: '800', color: '#111827' },
  smallButton: { backgroundColor: '#111827', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
  smallButtonText: { color: '#fff', fontWeight: '700' },
});
