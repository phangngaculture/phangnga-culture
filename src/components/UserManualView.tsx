import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Download,
  Printer,
  Search,
  FileText,
  Car,
  CheckCircle2,
  ShieldCheck,
  UserCheck,
  Fuel,
  Wrench,
  Navigation,
  BarChart3,
  Smartphone,
  MessageSquare,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Layers,
  ArrowRight,
  Clock,
  KeyRound,
  FileSpreadsheet,
  AlertTriangle,
  Info,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  Bookmark
} from 'lucide-react';
import { exportElementToPdf } from '../utils/pdfExport';
import { GarudaIcon } from './GarudaIcon';
import { User } from '../types';

interface UserManualViewProps {
  currentUser?: User;
  onNavigateTab?: (tab: string) => void;
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export const UserManualView: React.FC<UserManualViewProps> = ({
  currentUser,
  onNavigateTab,
  onShowToast
}) => {
  const [activeChapter, setActiveChapter] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Manual Chapters Data
  const chapters = useMemo(
    () => [
      {
        id: 0,
        title: 'ภาพรวมระบบและบทบาทผู้ใช้',
        subtitle: 'บทนำ โครงสร้าง และสิทธิ์การใช้งาน 4 บทบาท',
        icon: Layers,
        badge: 'พื้นฐาน',
        badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
        content: {
          summary:
            'ระบบเบิกใช้งานรถยนต์ราชการ สำนักงานวัฒนธรรมจังหวัดพังงา (M-Culture Phangnga Pro) พัฒนาขึ้นเพื่อบริหารจัดการยานพาหนะส่วนกลาง ยื่นคำขอขออนุมัติ ติดตามภารกิจ และลงบัญชีคุมตามระเบียบสำนักนายกรัฐมนตรีว่าด้วยรถราชการ พ.ศ. 2535 และที่แก้ไขเพิ่มเติม',
          points: [
            {
              title: 'วัตถุประสงค์หลักของระบบ',
              desc: 'ลดความซ้ำซ้อนของเอกสารกระดาษ สามารถเขียนใบเบิก ติดตามสถานะ อนุมัติแบบดิจิทัล และบันทึกเลขไมล์-ค่าน้ำมันได้อย่างโปร่งใส ตรวจสอบย้อนหลังได้ทุกภารกิจ'
            },
            {
              title: 'บทบาทผู้ใช้งาน 4 ระดับ (RBAC)',
              desc: 'ระบบแบ่งแยกหน้าที่ตามระเบียบราชการอย่างชัดเจน ดังนี้:'
            }
          ],
          roles: [
            {
              name: 'ผู้ดูแลระบบ (Admin)',
              badge: 'แอดมิน',
              color: 'text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300',
              duty: 'จัดการรายชื่อผู้ใช้งาน กำหนดสิทธิ์รายเมนู จัดการข้อมูลยานพาหนะ ตกแต่งระบบ สำรองและกู้คืนฐานข้อมูล Cloud Firestore'
            },
            {
              name: 'ผู้บริหารสั่งการ (Director)',
              badge: 'ผู้บริหาร',
              color: 'text-teal-600 bg-teal-50 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300',
              duty: 'พิจารณาตรวจสอบคำขอขอใช้รถยนต์ส่วนกลาง ลงลายมือชื่อดิจิทัล (Digital Signature) ให้ข้อสั่งการ และอนุมัติ/ไม่อนุมัติการใช้รถยนต์ราชการ'
            },
            {
              name: 'เจ้าหน้าที่ผู้ขอใช้รถ / งานพัสดุ (Officer)',
              badge: 'เจ้าหน้าที่',
              color: 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300',
              duty: 'เขียนใบเบิกขอใช้รถยนต์ราชการ พิมพ์ใบขออนุมัติ (แบบบันทึกข้อความ พง ๐๐๓๒(พิเศษ)/...) สมุดทะเบียนคุม และตรวจรับรถยนต์หลังเสร็จสิ้นภารกิจ'
            },
            {
              name: 'พนักงานขับรถยนต์ (Driver)',
              badge: 'คนขับรถ',
              color: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300',
              duty: 'ตรวจสอบตารางงานที่ได้รับมอบหมาย กดเริ่มภารกิจ บันทึกเลขไมล์ขาไป-ขากลับ แนบรูปถ่ายไมล์ บันทึกค่าน้ำมันเชื้อเพลิง และแจ้งตรวจสภาพรถ'
            }
          ]
        }
      },
      {
        id: 1,
        title: 'ขั้นตอนการเขียนใบเบิกใช้รถยนต์',
        subtitle: 'การสร้างคำขอ ระบุปลายทาง ผู้ร่วมเดินทาง และพิมพ์ใบขออนุมัติ',
        icon: FileText,
        badge: 'ขั้นตอนที่ 1',
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
        content: {
          summary: 'เจ้าหน้าที่ทุกกลุ่มงานสามารถยื่นคำขอใช้รถยนต์ส่วนกลางล่วงหน้าได้ผ่านเมนู "เขียนใบเบิกใช้รถ" ตลอด 24 ชั่วโมง',
          steps: [
            {
              step: '1',
              title: 'เข้าเมนู "เขียนใบเบิกใช้รถ"',
              desc: 'คลิกแถบเมนูข้าง "เขียนใบเบิกใช้รถ" หรือกดปุ่ม "ยื่นคำขอใหม่" จากหน้าหลักภาพรวม'
            },
            {
              step: '2',
              title: 'กรอกข้อมูลการเดินทาง',
              desc: 'ระบุวัน-เวลาที่ขอใช้รถ, วัตถุประสงค์การเดินทาง, สถานที่ปลายทาง (มีระบบช่วยค้นหาตำบล/อำเภอในจังหวัดพังงาและจังหวัดใกล้เคียง)'
            },
            {
              step: '3',
              title: 'ระบุยานพาหนะและพนักงานขับรถ',
              desc: 'เลือกรถยนต์ที่สถานะ "พร้อมใช้งาน (Available)" และเลือกพนักงานขับรถประจำรถ หรือระบุผู้ขับขี่เองตามระเบียบ'
            },
            {
              step: '4',
              title: 'ระบุผู้ร่วมเดินทางและเลขที่บันทึกข้อความ',
              desc: 'เพิ่มรายชื่อคณะผู้เดินทาง และระบุเลขที่บันทึกข้อความราชการ เช่น "พง ๐๐๓๒(พิเศษ)/..." จากนั้นกดปุ่ม "ส่งคำขอขอใช้รถ"'
            },
            {
              step: '5',
              title: 'พิมพ์ใบขออนุมัติ (แบบบันทึกข้อความ A4)',
              desc: 'เมื่อส่งคำขอเรียบร้อย สามารถคลิกไอคอน "พิมพ์ใบขออนุมัติ" เพื่อพิมพ์เอกสารทางการสารบรรณขนาด A4 หรือดาวน์โหลดเป็น PDF ได้ทันที'
            }
          ]
        }
      },
      {
        id: 2,
        title: 'แผงอนุมัติของผู้บริหาร',
        subtitle: 'การพิจารณา ลงนามดิจิทัล และข้อสั่งการของผู้บริหาร',
        icon: ShieldCheck,
        badge: 'ขั้นตอนที่ 2',
        badgeColor: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800',
        content: {
          summary:
            'ผู้ว่าราชการจังหวัด/วัฒนธรรมจังหวัด หรือผู้ได้รับมอบอำนาจ สามารถตรวจทานคำขอ ตารางงานที่ชนกัน และลงนามอนุมัติผ่านหน้าจอสมาร์ทโฟนหรือคอมพิวเตอร์',
          steps: [
            {
              step: '1',
              title: 'เปิดหน้า "แผงอนุมัติผู้บริหาร"',
              desc: 'ระบบจะแสดงรายการคำขอที่อยู่ในสถานะ "รอผู้บริหารสั่งการ (Pending)" พร้อมสรุปจำนวนคำขอที่รอดำเนินการ'
            },
            {
              step: '2',
              title: 'ตรวจสอบรายละเอียดความจำเป็นและตารางซ้อนทับ',
              desc: 'ดูข้อมูลสถานที่ ปลายทาง จำนวนผู้โดยสาร และตรวจสอบว่ารถยนต์หรือคนขับมีภารกิจอื่นทับซ้อนในช่วงเวลาดังกล่าวหรือไม่'
            },
            {
              step: '3',
              title: 'ลงนามลายมือชื่อดิจิทัล (Digital Signature)',
              desc: 'ใช้เมาส์ นิ้วสัมผัส หรือปากกาสไตลัสเซ็นลายมือชื่อบนหน้าจอ หรือเลือกลายมือชื่อที่บันทึกไว้ในระบบ'
            },
            {
              step: '4',
              title: 'ระบุข้อสั่งการและกด "อนุมัติ"',
              desc: 'พิมพ์ข้อสั่งการ (เช่น "เห็นควรอนุมัติให้ใช้รถยนต์ตามภารกิจ", "ขับขี่ด้วยความระมัดระวัง") แล้วกดยืนยันอนุมัติ ระบบจะส่งแจ้งเตือนผ่าน LINE ทันที'
            }
          ]
        }
      },
      {
        id: 3,
        title: 'ภารกิจพนักงานขับรถยนต์',
        subtitle: 'การเริ่มงาน บันทึกไมล์ไป-กลับ และส่งงานเสร็จสิ้น',
        icon: Navigation,
        badge: 'ขั้นตอนที่ 3',
        badgeColor: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
        content: {
          summary:
            'พนักงานขับรถสามารถปฏิบัติงานผ่านสมาร์ทโฟนได้โดยตรง สะดวก รวดเร็ว ไม่ต้องพกกระดาษจดไมล์ มีระบบคำนวณระยะทางรวมและแจ้งเตือนพัสดุอัตโนมัติ',
          steps: [
            {
              step: '1',
              title: 'ดูรายการภารกิจใน "ภารกิจคนขับรถ"',
              desc: 'เมื่อคำขอได้รับการอนุมัติ จะปรากฏในแท็บ "ภารกิจคนขับรถ" พร้อมรายละเอียดเวลา ปลายทาง และผู้ติดต่อ'
            },
            {
              step: '2',
              title: 'กด "เริ่มภารกิจ (Start Mission)"',
              desc: 'เมื่อพร้อมออกเดินทาง ให้กดปุ่มเริ่มงาน กรอกเลขไมล์เริ่มต้น (Start Mileage) และสามารถถ่ายรูปหน้าปัดไมล์แนบเป็นหลักฐานได้'
            },
            {
              step: '3',
              title: 'ระหว่างปฏิบัติภารกิจ',
              desc: 'สถานะรถจะเปลี่ยนเป็น "กำลังปฏิบัติภารกิจ (In Mission)" อัตโนมัติ เพื่อป้องกันการจองซ้อน'
            },
            {
              step: '4',
              title: 'กด "สิ้นสุดภารกิจ (Complete Mission)"',
              desc: 'เมื่อกลับถึงสำนักงาน ให้กดสิ้นสุดภารกิจ กรอกเลขไมล์สิ้นสุด (End Mileage) ระบบจะคำนวณระยะทางรวม (กม.) ให้อัตโนมัติ และแจ้งเตือนเจ้าหน้าที่พัสดุตรวจรับ'
            }
          ]
        }
      },
      {
        id: 4,
        title: 'งานพัสดุและการตรวจรับรถ',
        subtitle: 'สมุดทะเบียนคุมรถราชการ และการตรวจสภาพรับมอบรถ',
        icon: UserCheck,
        badge: 'ขั้นตอนที่ 4',
        badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800',
        content: {
          summary:
            'งานพัสดุมีหน้าที่กำกับดูแลรถยนต์ส่วนกลางให้พร้อมใช้งาน ตรวจสอบระยะทางจริง และจัดทำสมุดทะเบียนคุมการใช้รถยนต์ราชการเสนอผู้บังคับบัญชา',
          features: [
            {
              title: 'สมุดทะเบียนคุมการใช้รถ (Asset Register)',
              desc: 'รวบรวมประวัติการเดินทางทุกคัน วันที่ เลขไมล์ไป-กลับ ระยะทาง ผู้ขอใช้ และพนักงานขับรถ พร้อมปุ่มส่งออกสมุดคุมขนาด A4 และดาวน์โหลดเป็น Excel'
            },
            {
              title: 'ตรวจรับรถเสร็จสิ้นภารกิจ (Asset Inspection)',
              desc: 'เมื่อพนักงานขับรถสิ้นสุดงาน เจ้าหน้าที่พัสดุจะตรวจสภาพความสะอาด ระดับน้ำมัน อุปกรณ์ประจำรถ และลงชื่อตรวจรับมอบรถผ่านระบบ'
            },
            {
              title: 'ระบบรายงานความผิดปกติ',
              desc: 'หากพบเฉี่ยวชน อุปกรณ์ชำรุด หรือยางมีปัญหา สามารถบันทึกหมายเหตุเพื่อส่งซ่อมบำรุงในเมนูถัดไปได้ทันที'
            }
          ]
        }
      },
      {
        id: 5,
        title: 'เชื้อเพลิงและการบำรุงรักษา',
        subtitle: 'บันทึกเติมน้ำมัน เช็กระยะ ภาษี และ พ.ร.บ.',
        icon: Fuel,
        badge: 'การซ่อมบำรุง',
        badgeColor: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
        content: {
          summary:
            'ติดตามการใช้น้ำมันเชื้อเพลิงและประวัติการซ่อมบำรุงอย่างเป็นระบบ เพื่อควบคุมงบประมาณค่าใช้จ่ายและยืดอายุการใช้งานยานพาหนะของทางราชการ',
          topics: [
            {
              title: 'การบันทึกค่าน้ำมันเชื้อเพลิง (Fuel Log)',
              desc: 'ระบุทะเบียนรถ วันที่เติม จำนวนลิตร จำนวนเงิน และแนบรูปถ่ายใบเสร็จรับเงิน/สลิปปั๊มน้ำมัน'
            },
            {
              title: 'การคำนวณอัตราสิ้นเปลือง (km/L)',
              desc: 'ระบบช่วยวิเคราะห์อัตราการกินน้ำมันเฉลี่ย เพื่อตรวจเช็กสมรรถนะเครื่องยนต์และประเมินงบประมาณ'
            },
            {
              title: 'ตารางการบำรุงรักษา (Fleet Maintenance)',
              desc: 'แจ้งเตือนวันหมดอายุภาษีประจำปี, พ.ร.บ. คุ้มครองผู้ประสบภัยจากรถ, ประกันภัยชั้น 1 และรอบเช็กระยะถ่ายน้ำมันเครื่อง'
            }
          ]
        }
      },
      {
        id: 6,
        title: 'การแจ้งเตือน LINE และการติดตั้งแอป (PWA)',
        subtitle: 'เชื่อมต่อ LINE Messaging API และติดตั้งลงมือถือ iOS/Android',
        icon: Smartphone,
        badge: 'การเชื่อมต่อ',
        badgeColor: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/60 dark:text-green-300 dark:border-green-800',
        content: {
          summary:
            'ระบบรองรับการแจ้งเตือนแบบเรียลไทม์ผ่าน LINE และสามารถติดตั้งเป็นแอปพลิเคชันบนสมาร์ทโฟนได้โดยไม่ต้องดาวน์โหลดผ่าน App Store หรือ Play Store',
          guides: [
            {
              title: 'การติดตั้งบน iPhone / iPad (iOS Safari)',
              steps: [
                'เปิด Safari ไปที่ลิงก์ระบบ',
                'กดปุ่ม "แชร์ (Share)" ด้านล่างของหน้าจอ',
                'เลื่อนลงแล้วเลือก "เพิ่มไปยังหน้าจอโฮม (Add to Home Screen)"',
                'กด "เพิ่ม (Add)" จะได้ไอคอนแอป "รถราชการพังงา" ใช้งานแบบเต็มจอทันที'
              ]
            },
            {
              title: 'การติดตั้งบน Android (Google Chrome)',
              steps: [
                'เปิด Chrome ไปที่ลิงก์ระบบ',
                'กดปุ่ม 3 จุด (เมนู) ด้านขวาบน',
                'เลือก "ติดตั้งแอป (Install App)" หรือ "เพิ่มลงในหน้าจอหลัก"',
                'กดยืนยันการติดตั้ง'
              ]
            },
            {
              title: 'การรับแจ้งเตือนผ่าน LINE',
              steps: [
                'ระบุ LINE User ID ในหน้าจัดการโปรไฟล์',
                'เมื่อมีการยื่นคำขอใหม่ ระบบจะส่ง Flex Message ถึงแอดมินและผู้บริหาร',
                'เมื่อคำขอได้รับการอนุมัติ ระบบจะส่งแจ้งเตือนถึงผู้ยื่นคำขอและคนขับรถโดยตรง'
              ]
            }
          ]
        }
      },
      {
        id: 7,
        title: 'คำถามที่พบบ่อย (FAQ) และศูนย์ช่วยเหลือ',
        subtitle: 'วิธีแก้ปัญหาเบื้องต้น และช่องทางติดต่อเจ้าหน้าที่ผู้ดูแลระบบ',
        icon: HelpCircle,
        badge: 'ช่วยเหลือ',
        badgeColor: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
        content: {
          faqs: [
            {
              q: 'หากลืมรหัสผ่านหรือเข้าสู่ระบบไม่ได้ ควรทำอย่างไร?',
              a: 'สามารถติดต่อแอดมินประจำสำนักงานเพื่อรีเซ็ตรหัสผ่าน โดยรหัสผ่านเริ่มต้นสำหรับเจ้าหน้าที่คือ "1234" หรือ "dekcom2537"'
            },
            {
              q: 'สามารถแก้ไขคำขอหลังจากยื่นไปแล้วได้หรือไม่?',
              a: 'สามารถแก้ไขรายละเอียดได้ตราบใดที่คำขอยังอยู่ในสถานะ "รออนุมัติ (Pending)" หากผู้บริหารอนุมัติแล้ว จะต้องแจ้งยกเลิกและสร้างคำขอใหม่'
            },
            {
              q: 'คนขับรถไม่มีสมาร์ทโฟน จะบันทึกไมล์ได้อย่างไร?',
              a: 'เจ้าหน้าที่ผู้ขอใช้รถ หรือเจ้าหน้าที่ธุรการ/งานพัสดุ สามารถเป็นผู้ช่วยกดเริ่มและสิ้นสุดภารกิจแทนพนักงานขับรถได้'
            },
            {
              q: 'ข้อมูลในระบบจะสูญหายหรือไม่หากปิดเบราว์เซอร์?',
              a: 'ข้อมูลทั้งหมดถูกจัดเก็บแบบ Real-time บนระบบ Cloud Firestore และมีแคชสำรองบนอุปกรณ์ ไม่สูญหายแน่นอน'
            }
          ],
          contact: {
            office: 'สำนักงานวัฒนธรรมจังหวัดพังงา กระทรวงวัฒนธรรม',
            address: 'ศาลากลางจังหวัดพังงา (หลังเก่า) ถนนเพชรเกษม ตำบลท้ายช้าง อำเภอเมืองพังงา จังหวัดพังงา ๘๒๐๐๐',
            tel: '๐๗๖-๔๘๑๔๘๒ หรือ ๐๗๖-๔๘๑๔๘๓',
            email: 'admin.phangnga@m-culture.go.th',
            web: 'https://phangnga.m-culture.go.th'
          }
        }
      }
    ],
    []
  );

  // Filtered chapters based on search query
  const filteredChapters = useMemo(() => {
    if (!searchQuery.trim()) return chapters;
    const q = searchQuery.toLowerCase().trim();
    return chapters.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.subtitle.toLowerCase().includes(q) ||
        JSON.stringify(c.content).toLowerCase().includes(q)
    );
  }, [chapters, searchQuery]);

  // Handle PDF Export of the full manual
  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    onShowToast?.('กำลังประมวลผลจัดทำเอกสารคู่มือ PDF...', 'info');

    try {
      await exportElementToPdf('printUserManualArea', {
        fileName: 'คู่มือการใช้งานระบบรถยนต์ราชการ_สวจ_พังงา.pdf',
        orientation: 'portrait'
      });
      onShowToast?.('ดาวน์โหลดคู่มือการใช้งานระบบ (PDF) สำเร็จแล้ว', 'success');
    } catch (err) {
      console.error('[PDF Export Error]', err);
      // Fallback to window.print() if canvas rendering is restricted
      window.print();
      onShowToast?.('เปิดหน้าต่างพิมพ์คู่มือเรียบร้อย (สามารถเลือกบันทึกเป็น PDF ได้)', 'info');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Handle native browser print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 p-6 sm:p-8 text-white shadow-xl border border-indigo-500/20">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              <BookOpen className="w-3.5 h-3.5" />
              <span>เอกสารมาตรฐานการปฏิบัติงาน (SOP)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <span>คู่มือการใช้งานระบบรถยนต์ราชการ</span>
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                v5.2 PRO
              </span>
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              สำนักงานวัฒนธรรมจังหวัดพังงา กระทรวงวัฒนธรรม • คู่มือแนะนำขั้นตอนการยื่นคำขอ อนุมัติ ภารกิจคนขับรถ บันทึกไมล์-เชื้อเพลิง และพิมพ์เอกสารราชการ
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-orange-500/25 flex items-center space-x-2 transition cursor-pointer disabled:opacity-50"
              title="ดาวน์โหลดคู่มือฉบับเต็มเป็นไฟล์ PDF สำหรับเปิดดูหรือเก็บไว้ในเครื่อง"
            >
              {isExportingPdf ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>กำลังสร้าง PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>ดาวน์โหลดคู่มือ PDF</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs sm:text-sm border border-white/15 flex items-center space-x-2 transition cursor-pointer backdrop-blur-md"
              title="สั่งพิมพ์คู่มือหรือบันทึกเป็น PDF ผ่านเบราว์เซอร์"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์คู่มือ</span>
            </button>
          </div>
        </div>

        {/* Quick Search Bar */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาขั้นตอนในคู่มือ (เช่น เขียนใบเบิก, ลายเซ็น, ค่าน้ำมัน)..."
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-slate-900/60 transition"
            />
          </div>

          <div className="text-xs text-slate-300 flex items-center space-x-2 w-full sm:w-auto justify-end">
            <Bookmark className="w-3.5 h-3.5 text-amber-400" />
            <span>มีทั้งหมด {chapters.length} หมวดการใช้งาน</span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout: Sidebar Navigation & Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Chapter Navigation List (4 cols) */}
        <div className="lg:col-span-4 space-y-2 bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 shadow-sm sticky top-20">
          <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>สารบัญคู่มือ (Contents)</span>
            <span className="text-[10px] text-slate-500 font-normal">คลิกเพื่อเลือกอ่าน</span>
          </div>

          <div className="space-y-1 max-h-[calc(100vh-14rem)] overflow-y-auto pr-1">
            {filteredChapters.map((chapter) => {
              const Icon = chapter.icon;
              const isActive = activeChapter === chapter.id;
              return (
                <button
                  key={chapter.id}
                  onClick={() => setActiveChapter(chapter.id)}
                  className={`w-full text-left p-3 rounded-xl transition flex items-start space-x-3 cursor-pointer group ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent border-l-4 border-orange-500 text-slate-900 dark:text-white font-semibold'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg shrink-0 mt-0.5 transition ${
                      isActive
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold truncate">{chapter.title}</span>
                      <ChevronRight
                        className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                          isActive ? 'text-orange-500 translate-x-0.5' : 'text-slate-400 opacity-0 group-hover:opacity-100'
                        }`}
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {chapter.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Reader View (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {filteredChapters.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800">
              <HelpCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">ไม่พบบทความที่ตรงกับคำค้นหา</h3>
              <p className="text-xs text-slate-500 mt-1">ลองเปลี่ยนคำค้นหา หรือกดล้างการค้นหาเพื่อดูคู่มือทั้งหมด</p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-xl text-xs font-medium hover:bg-orange-600 transition"
              >
                ล้างการค้นหา
              </button>
            </div>
          ) : (
            (() => {
              const currentChapter = chapters.find((c) => c.id === activeChapter) || chapters[0];
              const Icon = currentChapter.icon;

              return (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 animate-in fade-in duration-300">
                  {/* Chapter Header */}
                  <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
                    <div className="space-y-1">
                      <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${currentChapter.badgeColor}">
                        <span>{currentChapter.badge}</span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                        <Icon className="w-6 h-6 text-orange-500" />
                        <span>{currentChapter.title}</span>
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                        {currentChapter.subtitle}
                      </p>
                    </div>

                    <button
                      onClick={handleDownloadPdf}
                      className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition cursor-pointer"
                      title="ส่งออกเอกสาร PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>
                  </div>

                  {/* Summary Callout */}
                  <div className="p-4 rounded-xl bg-orange-50/70 dark:bg-orange-950/20 border border-orange-200/60 dark:border-orange-800/40 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed flex items-start space-x-3">
                    <Info className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                    <span>{currentChapter.content.summary}</span>
                  </div>

                  {/* Dynamic Content Rendering based on chapter type */}
                  {/* Chapter 0: Roles */}
                  {currentChapter.content.roles && (
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        สิทธิ์และหน้าที่ของแต่ละบทบาทในระบบ
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {currentChapter.content.roles.map((r, idx) => (
                          <div
                            key={idx}
                            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900 dark:text-white">{r.name}</span>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${r.color}`}>
                                {r.badge}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{r.duty}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step by Step Workflows */}
                  {currentChapter.content.steps && (
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        ขั้นตอนการปฏิบัติงานทีละลำดับ (Step-by-Step)
                      </h4>
                      <div className="space-y-3">
                        {currentChapter.content.steps.map((st, idx) => (
                          <div
                            key={idx}
                            className="flex items-start space-x-3.5 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 hover:border-orange-200 dark:hover:border-orange-900 transition"
                          >
                            <div className="w-7 h-7 rounded-lg bg-orange-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                              {st.step}
                            </div>
                            <div className="space-y-0.5">
                              <h5 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                                {st.title}
                              </h5>
                              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{st.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Feature Lists */}
                  {currentChapter.content.features && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        ฟังก์ชันและเครื่องมือที่เกี่ยวข้อง
                      </h4>
                      <div className="grid grid-cols-1 gap-3">
                        {currentChapter.content.features.map((f, idx) => (
                          <div
                            key={idx}
                            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-1"
                          >
                            <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 dark:text-white">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              <span>{f.title}</span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 pl-6 leading-relaxed">{f.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Topics List */}
                  {currentChapter.content.topics && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">หัวข้อสำคัญ</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {currentChapter.content.topics.map((t, idx) => (
                          <div
                            key={idx}
                            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-1.5"
                          >
                            <span className="text-xs font-bold text-slate-900 dark:text-white block">{t.title}</span>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{t.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Guides (PWA / Mobile) */}
                  {currentChapter.content.guides && (
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        คำแนะนำการติดตั้งและการเชื่อมต่อ
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentChapter.content.guides.map((g, idx) => (
                          <div
                            key={idx}
                            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 space-y-2"
                          >
                            <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                              <Smartphone className="w-3.5 h-3.5 text-indigo-500" />
                              <span>{g.title}</span>
                            </h5>
                            <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-decimal pl-4">
                              {g.steps.map((st, sIdx) => (
                                <li key={sIdx}>{st}</li>
                              ))}
                            </ol>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* FAQs */}
                  {currentChapter.content.faqs && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">คำถามที่พบบ่อย (FAQs)</h4>
                      <div className="space-y-2.5">
                        {currentChapter.content.faqs.map((faq, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1"
                          >
                            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-start space-x-2">
                              <span className="text-orange-500 font-extrabold">Q:</span>
                              <span>{faq.q}</span>
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-400 pl-5 leading-relaxed">
                              {faq.a}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contact Support */}
                  {currentChapter.content.contact && (
                    <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/20 space-y-3">
                      <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-indigo-600" />
                        <span>ติดต่อขอความช่วยเหลือ / แจ้งปัญหาการใช้งาน</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-300">
                        <div className="flex items-start space-x-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                          <span>{currentChapter.content.contact.address}</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>โทร: {currentChapter.content.contact.tel}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>อีเมล: {currentChapter.content.contact.email}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bottom Navigation for chapters */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => setActiveChapter((prev) => Math.max(0, prev - 1))}
                      disabled={activeChapter === 0}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition cursor-pointer"
                    >
                      ← หมวดก่อนหน้า
                    </button>

                    <span className="text-xs text-slate-400">
                      หมวดที่ {activeChapter + 1} จาก {chapters.length}
                    </span>

                    <button
                      onClick={() => setActiveChapter((prev) => Math.min(chapters.length - 1, prev + 1))}
                      disabled={activeChapter === chapters.length - 1}
                      className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium disabled:opacity-40 transition cursor-pointer"
                    >
                      หมวดถัดไป →
                    </button>
                  </div>
                </div>
              );
            })()
          )}
        </div>
      </div>

      {/* =========================================================================
          OFFICIAL PRINTABLE A4 CONTAINER (ใช้สำหรับการพิมพ์ & ดาวน์โหลดเป็น PDF)
          จะไม่แสดงบนหน้าจอปกติ แต่จะถูก clone และแปลงเป็น PDF ผ่าน html2canvas + jsPDF
          ========================================================================= */}
      <div className="hidden">
        <div
          id="printUserManualArea"
          className="printable-document bg-white text-slate-900 p-10 font-sans"
          style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', backgroundColor: '#ffffff', color: '#000000' }}
        >
          {/* Official Letterhead */}
          <div className="text-center border-b-2 border-slate-900 pb-6 mb-6">
            <div className="inline-flex justify-center mb-3">
              <GarudaIcon className="w-20 h-20 text-slate-900" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              คู่มือการปฏิบัติงานการใช้รถยนต์ส่วนกลาง
            </h1>
            <h2 className="text-lg font-semibold text-slate-800 mt-1">
              สำนักงานวัฒนธรรมจังหวัดพังงา กระทรวงวัฒนธรรม
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              ระบบ e-Service Platform บริหารจัดการยานพาหนะ ขออนุมัติ และบันทึกภารกิจตามระเบียบสำนักนายกรัฐมนตรี
            </p>
          </div>

          {/* Table of Contents Summary */}
          <div className="mb-6 p-4 rounded-lg border border-slate-300 bg-slate-50 text-xs">
            <h3 className="font-bold text-slate-900 mb-2 uppercase tracking-wide">สารบัญหมวดการปฏิบัติงาน</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
              {chapters.map((c, i) => (
                <div key={i} className="flex justify-between border-b border-dotted border-slate-300 py-0.5">
                  <span>{i + 1}. {c.title}</span>
                  <span className="text-slate-500 font-mono">หน้า {i + 1}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Content Chapters */}
          <div className="space-y-6 text-xs text-slate-800 leading-relaxed">
            {chapters.map((ch, idx) => (
              <div key={idx} className="pb-6 border-b border-slate-200 space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">{ch.title}</h3>
                </div>
                <p className="text-slate-600 italic text-[11px] pl-7">{ch.subtitle}</p>
                <p className="pl-7">{ch.content.summary}</p>

                {ch.content.steps && (
                  <div className="pl-7 pt-2 space-y-1.5">
                    {ch.content.steps.map((st, sidx) => (
                      <div key={sidx} className="flex items-start space-x-2">
                        <span className="font-bold text-slate-700">{st.step}.</span>
                        <div>
                          <span className="font-semibold text-slate-900">{st.title}: </span>
                          <span className="text-slate-600">{st.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {ch.content.roles && (
                  <div className="pl-7 pt-2 grid grid-cols-2 gap-2">
                    {ch.content.roles.map((r, ridx) => (
                      <div key={ridx} className="p-2 border border-slate-300 rounded bg-slate-50 text-[11px]">
                        <span className="font-bold text-slate-900 block">{r.name} ({r.badge}):</span>
                        <span className="text-slate-600">{r.duty}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Official Sign-off Footer */}
          <div className="mt-8 pt-6 border-t border-slate-400 text-center text-xs text-slate-600 space-y-1">
            <p className="font-semibold text-slate-800">
              ฝ่ายบริหารทั่วไป สำนักงานวัฒนธรรมจังหวัดพังงา กระทรวงวัฒนธรรม
            </p>
            <p>
              ศาลากลางจังหวัดพังงา (หลังเก่า) ถนนเพชรเกษม ตำบลท้ายช้าง อำเภอเมืองพังงา จังหวัดพังงา โทร. ๐๗๖-๔๘๑๔๘๒
            </p>
            <p className="text-[10px] text-slate-400 pt-2">
              พิมพ์เมื่อวันที่ {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })} • ระบบเบิกใช้งานรถยนต์ราชการ M-Culture Phangnga Pro
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
