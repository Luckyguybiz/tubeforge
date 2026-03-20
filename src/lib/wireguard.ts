import { generateKeyPairSync } from 'crypto';
import { execSync } from 'child_process';
import { db } from '@/server/db';

export function generateWireGuardKeys(): { privateKey: string; publicKey: string } {
  const { publicKey, privateKey } = generateKeyPairSync('x25519', {
    publicKeyEncoding: { type: 'spki', format: 'der' },
    privateKeyEncoding: { type: 'pkcs8', format: 'der' },
  });
  const rawPrivate = privateKey.subarray(privateKey.length - 32);
  const rawPublic = publicKey.subarray(publicKey.length - 32);
  return {
    privateKey: rawPrivate.toString('base64'),
    publicKey: rawPublic.toString('base64'),
  };
}

export async function allocateIp(): Promise<string> {
  const lastPeer = await db.vpnPeer.findFirst({
    orderBy: { assignedIp: 'desc' },
    select: { assignedIp: true },
  });
  if (!lastPeer) return '10.8.0.2';
  const lastOctet = parseInt(lastPeer.assignedIp.split('.')[3], 10);
  if (lastOctet >= 254) throw new Error('VPN IP pool exhausted');
  return `10.8.0.${lastOctet + 1}`;
}

export function generateConfig(privateKey: string, assignedIp: string): string {
  const serverPubKey = process.env.VPN_SERVER_PUBLIC_KEY || '';
  const endpoint = process.env.VPN_SERVER_ENDPOINT || '57.128.254.111:51820';
  return `[Interface]
PrivateKey = ${privateKey}
Address = ${assignedIp}/32
DNS = 1.1.1.1, 8.8.8.8

[Peer]
PublicKey = ${serverPubKey}
Endpoint = ${endpoint}
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25
`;
}

export function addPeerToServer(publicKey: string, assignedIp: string): void {
  // Validate inputs to prevent command injection
  if (!/^[A-Za-z0-9+/=]{43,44}$/.test(publicKey)) throw new Error('Invalid public key format');
  if (!/^10\.8\.0\.\d{1,3}$/.test(assignedIp)) throw new Error('Invalid IP format');
  execSync(`sudo wg set wg0 peer "${publicKey}" allowed-ips "${assignedIp}/32"`, { timeout: 5000 });
  execSync('sudo wg-quick save wg0', { timeout: 5000 });
}

export function removePeerFromServer(publicKey: string): void {
  if (!/^[A-Za-z0-9+/=]{43,44}$/.test(publicKey)) throw new Error('Invalid public key format');
  execSync(`sudo wg set wg0 peer "${publicKey}" remove`, { timeout: 5000 });
  execSync('sudo wg-quick save wg0', { timeout: 5000 });
}
