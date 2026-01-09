import dns from 'dns';
import { promisify } from 'util';

const resolveMx = promisify(dns.resolveMx);

export async function POST(request) {
  try {
    const { email } = await request.json();
    
    if (!email || !email.includes('@')) {
      return Response.json({ valid: false, reason: 'FORMAT_INVALID' }, { status: 400 });
    }

    const domain = email.split('@')[1];

    try {
      // Kiểm tra xem domain có bản ghi MX (Mail Exchange) không
      // Nếu domain không tồn tại hoặc không nhận mail, hàm này sẽ throw error
      const addresses = await resolveMx(domain);
      
      if (addresses && addresses.length > 0) {
        return Response.json({ valid: true });
      } else {
        return Response.json({ valid: false, reason: 'NO_MX_RECORD' });
      }
    } catch (error) {
        // Lỗi này xảy ra khi tên miền hoàn toàn không tồn tại (như mgaslcas)
        return Response.json({ valid: false, reason: 'DOMAIN_NOT_FOUND' });
    }

  } catch (error) {
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}