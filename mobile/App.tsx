import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { finishTransaction, useIAP, type Purchase } from 'expo-iap';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import { supabase } from './src/supabase';
import { createProject, deleteAccount, getSignedOutput, listProjects, startRender, type MobileProject } from './src/api';
import { verifyNativePurchase } from './src/billing-api';
import { BILLING_PRODUCTS } from '../lib/billing/catalog';
import { uploadVideo } from './src/upload';

type Format = '9:16' | '1:1' | '16:9';
const formats: Format[] = ['9:16', '1:1', '16:9'];
const nativePlatform = Platform.OS === 'ios' ? 'ios' : 'android';

export default function App() {
  const [sessionReady, setSessionReady] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [billingBusy, setBillingBusy] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [projects, setProjects] = useState<MobileProject[]>([]);

  const { connected, products, fetchProducts, requestPurchase, getAvailablePurchases } = useIAP({
    onPurchaseSuccess: async (purchase) => {
      await handlePurchase(purchase);
    },
    onPurchaseError: (error) => {
      setBillingBusy(false);
      setStatus(error instanceof Error ? error.message : 'Pembelian gagal.');
    },
  });

  const [status, setStatus] = useState('');

  async function handlePurchase(purchase: Purchase) {
    const product = BILLING_PRODUCTS.find((item) => item.id === purchase.productId);
    if (!product) {
      setStatus('Produk pembelian tidak dikenali.');
      setBillingBusy(false);
      return;
    }
    try {
      const proof = purchase.purchaseToken;
      if (!proof) throw new Error('Bukti transaksi tidak tersedia.');
      const result = await verifyNativePurchase({
        platform: nativePlatform,
        productId: product.id,
        proof,
      });
      await finishTransaction({
        purchase,
        isConsumable: product.kind === 'consumable',
      });
      setStatus(result.alreadyProcessed ? 'Pembelian sudah diproses sebelumnya.' : `Pembelian berhasil. +${result.creditsGranted} credit.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Pembayaran belum dapat diverifikasi.');
      // Do not finish an unverified transaction. The store can replay it later.
    } finally {
      setBillingBusy(false);
    }
  }

  async function buy(productId: string) {
    const product = BILLING_PRODUCTS.find((item) => item.id === productId);
    if (!product || !connected || billingBusy) return;
    setBillingBusy(true);
    setStatus('Membuka pembayaran...');
    try {
      await requestPurchase({
        request: {
          apple: { sku: product.id },
          google: { skus: [product.id] },
        },
        type: product.kind === 'subscription' ? 'subs' : 'in-app',
      });
    } catch (error) {
      setBillingBusy(false);
      setStatus(error instanceof Error ? error.message : 'Gagal membuka pembayaran.');
    }
  }

  async function restorePurchases() {
    if (!connected || billingBusy) return;
    setBillingBusy(true);
    setStatus('Memulihkan pembelian...');
    try {
      const purchases = (await getAvailablePurchases()) as Purchase[];
      for (const purchase of purchases) await handlePurchase(purchase);
      if (purchases.length === 0) setStatus('Tidak ada pembelian yang perlu dipulihkan.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Gagal memulihkan pembelian.');
      setBillingBusy(false);
    }
  }

  function confirmDeleteAccount() {
    Alert.alert(
      'Hapus akun?',
      'Akun, project, job, dan video kamu akan dihapus permanen. Data transaksi pembayaran akan dipertahankan tanpa keterkaitan ke akun.',
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus permanen', style: 'destructive', onPress: deleteMyAccount },
      ],
    );
  }
