import Link from 'next/link'
import { Sparkles, ArrowLeft, Shield, Lock, Eye, Database, UserCheck, Mail } from 'lucide-react'

export const metadata = {
  title: 'Chính sách bảo mật | KEN AI',
  description: 'Chính sách bảo mật và quyền riêng tư của nền tảng quản lý du học thông minh KEN AI',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">KEN AI</h1>
            </Link>
            <Link 
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại trang chủ
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              Chính sách bảo mật
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Cập nhật lần cuối: Ngày 06 tháng 04 năm 2026
            </p>
          </div>

          <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
            {/* Introduction */}
            <section className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-4">
                <Shield className="w-12 h-12 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Cam kết bảo mật của chúng tôi</h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    Tại KEN AI, chúng tôi coi trọng quyền riêng tư và bảo mật dữ liệu của bạn. Chính sách này giải thích cách chúng tôi thu thập, sử dụng, lưu trữ và bảo vệ thông tin cá nhân của bạn khi bạn sử dụng nền tảng quản lý du học thông minh của chúng tôi.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 1: Information We Collect */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                1. Thông tin chúng tôi thu thập
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>Chúng tôi thu thập các loại thông tin sau để cung cấp và cải thiện Dịch vụ:</p>
                
                <div className="space-y-4 ml-4">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">a) Thông tin tài khoản</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Họ và tên đầy đủ</li>
                      <li>Địa chỉ email công ty</li>
                      <li>Mật khẩu (được mã hóa)</li>
                      <li>Vai trò trong tổ chức (Admin, Manager, Counselor, Processor)</li>
                      <li>Tên trung tâm tư vấn du học</li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">b) Dữ liệu hồ sơ học sinh</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Thông tin cá nhân học sinh (tên, ngày sinh, quốc tịch)</li>
                      <li>Tài liệu tùy thân (hộ chiếu, CMND/CCCD)</li>
                      <li>Bảng điểm, chứng chỉ ngôn ngữ (IELTS, TOEFL, v.v.)</li>
                      <li>Thông tin trường học và chương trình đăng ký</li>
                      <li>Tình trạng visa và tiến trình hồ sơ</li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">c) Dữ liệu sử dụng</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Log truy cập và hoạt động trên hệ thống</li>
                      <li>Tương tác với trợ lý AI (câu hỏi, phản hồi)</li>
                      <li>Hiệu suất hệ thống và số liệu phân tích</li>
                      <li>Thông tin thiết bị và trình duyệt</li>
                      <li>Địa chỉ IP và vị trí địa lý gần đúng</li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">d) Thông tin thanh toán</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Thông tin gói dịch vụ đã đăng ký</li>
                      <li>Lịch sử thanh toán và hóa đơn</li>
                      <li><strong>Lưu ý:</strong> Thông tin thẻ tín dụng được xử lý bởi bên thứ ba (Stripe, PayPal) và không được lưu trữ trên hệ thống của chúng tôi</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: How We Use Your Information */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Eye className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                2. Cách chúng tôi sử dụng thông tin của bạn
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>Chúng tôi sử dụng thông tin thu thập được cho các mục đích sau:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Cung cấp Dịch vụ:</strong> Quản lý hồ sơ học sinh, xử lý tài liệu OCR, hỗ trợ AI tự động</li>
                  <li><strong>Cải thiện trải nghiệm:</strong> Phân tích hành vi người dùng để tối ưu hóa giao diện và tính năng</li>
                  <li><strong>Hỗ trợ khách hàng:</strong> Phản hồi yêu cầu, giải đáp thắc mắc, khắc phục sự cố</li>
                  <li><strong>Bảo mật:</strong> Phát hiện và ngăn chặn gian lận, lạm dụng hoặc hoạt động trái phép</li>
                  <li><strong>Thông báo:</strong> Gửi email về cập nhật sản phẩm, thay đổi chính sách, hoặc khuyến mãi (bạn có thể hủy đăng ký bất cứ lúc nào)</li>
                  <li><strong>Tuân thủ pháp luật:</strong> Đáp ứng yêu cầu của cơ quan chức năng theo quy định pháp luật Việt Nam</li>
                  <li><strong>Nghiên cứu và phát triển:</strong> Đào tạo mô hình AI, cải thiện độ chính xác của OCR và chatbot</li>
                </ul>
              </div>
            </section>

            {/* Section 3: Data Storage & Security */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Lock className="w-6 h-6 text-green-600 dark:text-green-400" />
                3. Lưu trữ và bảo mật dữ liệu
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">a) Nơi lưu trữ</h3>
                <p>
                  Dữ liệu của bạn được lưu trữ trên các máy chủ an toàn tại Việt Nam và Singapore, tuân thủ quy định về chủ quyền dữ liệu. Chúng tôi sử dụng nhà cung cấp đám mây uy tín (Supabase, Vercel) với chứng nhận bảo mật quốc tế.
                </p>

                <h3 className="font-semibold text-gray-900 dark:text-white mt-6">b) Biện pháp bảo mật</h3>
                <div className="grid md:grid-cols-2 gap-4 ml-4">
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                    <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2">Mã hóa dữ liệu</h4>
                    <ul className="text-sm space-y-1 text-green-700 dark:text-green-400">
                      <li>• Mã hóa end-to-end (AES-256)</li>
                      <li>• SSL/TLS cho truyền tải dữ liệu</li>
                      <li>• Băm mật khẩu (bcrypt)</li>
                    </ul>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Kiểm soát truy cập</h4>
                    <ul className="text-sm space-y-1 text-blue-700 dark:text-blue-400">
                      <li>• Xác thực hai yếu tố (2FA)</li>
                      <li>• Phân quyền RBAC chi tiết</li>
                      <li>• Logging và audit trails</li>
                    </ul>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                    <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-2">Sao lưu & Khôi phục</h4>
                    <ul className="text-sm space-y-1 text-purple-700 dark:text-purple-400">
                      <li>• Sao lưu tự động hàng ngày</li>
                      <li>• Lưu trữ đa vùng (multi-region)</li>
                      <li>• Recovery point objective &lt; 24h</li>
                    </ul>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                    <h4 className="font-semibold text-orange-800 dark:text-orange-300 mb-2">Giám sát 24/7</h4>
                    <ul className="text-sm space-y-1 text-orange-700 dark:text-orange-400">
                      <li>• Phát hiện xâm nhập (IDS/IPS)</li>
                      <li>• Cảnh báo thời gian thực</li>
                      <li>• Đánh giá lỗ hổng định kỳ</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 4: Data Sharing */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <UserCheck className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                4. Chia sẻ thông tin
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p className="font-semibold text-green-700 dark:text-green-400">
                  ✓ Chúng tôi KHÔNG bán, cho thuê hoặc chia sẻ thông tin cá nhân của bạn cho bên thứ ba vì mục đích thương mại.
                </p>
                <p>Chúng tôi chỉ chia sẻ thông tin trong các trường hợp hạn chế sau:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Nhà cung cấp dịch vụ:</strong> Các đối tác đáng tin cậy giúp vận hành Dịch vụ (Supabase, Vercel, AWS). Họ chỉ được truy cập dữ liệu cần thiết và phải tuân thủ các thỏa thuận bảo mật nghiêm ngặt.</li>
                  <li><strong>Yêu cầu pháp lý:</strong> Khi có lệnh tòa án, yêu cầu từ cơ quan thực thi pháp luật, hoặc để tuân thủ nghĩa vụ pháp lý.</li>
                  <li><strong>Bảo vệ quyền lợi:</strong> Để bảo vệ quyền, tài sản hoặc an toàn của KEN AI, người dùng của chúng tôi hoặc công chúng.</li>
                  <li><strong>Chuyển nhượng kinh doanh:</strong> Trong trường hợp sáp nhập, mua lại hoặc bán tài sản, thông tin người dùng có thể được chuyển giao như một phần của giao dịch (với thông báo trước).</li>
                  <li><strong>Với sự đồng ý của bạn:</strong> Khi bạn explicitly cho phép chia sẻ thông tin cụ thể.</li>
                </ul>
              </div>
            </section>

            {/* Section 5: Your Rights */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <UserCheck className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                5. Quyền của bạn
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>Theo Luật An ninh mạng Việt Nam và các quy định về bảo vệ dữ liệu cá nhân, bạn có các quyền sau:</p>
                <div className="space-y-3 ml-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">1</span>
                    </div>
                    <div>
                      <strong>Quyền truy cập:</strong> Bạn có thể yêu cầu xem thông tin cá nhân mà chúng tôi đang lưu giữ về bạn.
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-purple-600 dark:text-purple-400">2</span>
                    </div>
                    <div>
                      <strong>Quyền chỉnh sửa:</strong> Bạn có thể cập nhật hoặc sửa thông tin không chính xác thông qua cài đặt tài khoản hoặc liên hệ với chúng tôi.
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-green-600 dark:text-green-400">3</span>
                    </div>
                    <div>
                      <strong>Quyền xóa:</strong> Bạn có thể yêu cầu xóa tài khoản và dữ liệu cá nhân của mình. Lưu ý: Một số dữ liệu có thể được giữ lại để tuân thủ nghĩa vụ pháp lý.
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-orange-600 dark:text-orange-400">4</span>
                    </div>
                    <div>
                      <strong>Quyền hạn chế xử lý:</strong> Bạn có thể yêu cầu chúng tôi tạm ngừng xử lý dữ liệu cá nhân của bạn trong một số trường hợp nhất định.
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-red-600 dark:text-red-400">5</span>
                    </div>
                    <div>
                      <strong>Quyền phản đối:</strong> Bạn có thể phản đối việc xử lý dữ liệu cho mục đích marketing hoặc nghiên cứu.
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">6</span>
                    </div>
                    <div>
                      <strong>Quyền khiếu nại:</strong> Nếu bạn cho rằng chúng tôi vi phạm quyền riêng tư của bạn, bạn có thể khiếu nại đến cơ quan có thẩm quyền.
                    </div>
                  </div>
                </div>
                <p className="mt-4">
                  Để thực hiện các quyền này, vui lòng liên hệ với chúng tôi qua email: <a href="mailto:support@kenai.id.vn" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">support@kenai.id.vn</a>
                </p>
              </div>
            </section>

            {/* Section 6: Cookies & Tracking */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">6. Cookies và công nghệ theo dõi</h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>
                  Chúng tôi sử dụng cookies và các công nghệ tương tự để cải thiện trải nghiệm người dùng, phân tích lưu lượng truy cập và cá nhân hóa nội dung.
                </p>
                <p><strong>Các loại cookies chúng tôi sử dụng:</strong></p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Cookies thiết yếu:</strong> Cần thiết cho hoạt động cơ bản của trang web (đăng nhập, bảo mật)</li>
                  <li><strong>Cookies hiệu suất:</strong> Giúp chúng tôi hiểu cách người dùng tương tác với trang web (Google Analytics)</li>
                  <li><strong>Cookies chức năng:</strong> Ghi nhớ tùy chọn của bạn (ngôn ngữ, chủ đề sáng/tối)</li>
                  <li><strong>Cookies targeting:</strong> Cung cấp nội dung và quảng cáo phù hợp với sở thích của bạn</li>
                </ul>
                <p>
                  Bạn có thể kiểm soát cookies thông qua cài đặt trình duyệt. Tuy nhiên, việc vô hiệu hóa một số cookies có thể ảnh hưởng đến chức năng của trang web.
                </p>
              </div>
            </section>

            {/* Section 7: Children's Privacy */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">7. Quyền riêng tư của trẻ em</h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>
                  Dịch vụ của chúng tôi không dành cho trẻ em dưới 16 tuổi. Chúng tôi không cố ý thu thập thông tin cá nhân từ trẻ em. Nếu bạn là phụ huynh hoặc người giám hộ và biết rằng con bạn đã cung cấp thông tin cá nhân cho chúng tôi, vui lòng liên hệ ngay với chúng tôi để chúng tôi xóa thông tin đó.
                </p>
              </div>
            </section>

            {/* Section 8: International Transfers */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">8. Chuyển dữ liệu quốc tế</h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>
                  Vì chúng tôi sử dụng các dịch vụ đám mây toàn cầu, dữ liệu của bạn có thể được chuyển và lưu trữ bên ngoài Việt Nam (ví dụ: Singapore, Hoa Kỳ). Chúng tôi đảm bảo rằng mọi việc chuyển dữ liệu đều tuân thủ các biện pháp bảo vệ phù hợp và quy định pháp luật hiện hành.
                </p>
              </div>
            </section>

            {/* Section 9: Data Retention */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">9. Lưu giữ dữ liệu</h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>Chúng tôi lưu giữ thông tin cá nhân của bạn trong khoảng thời gian cần thiết để:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Cung cấp Dịch vụ cho bạn</li>
                  <li>Tuân thủ nghĩa vụ pháp lý (thường là 5-7 năm theo quy định kế toán)</li>
                  <li>Giải quyết tranh chấp hoặc thực thi thỏa thuận</li>
                </ul>
                <p>
                  Sau khi tài khoản của bạn bị xóa, chúng tôi sẽ xóa hoặc ẩn danh thông tin cá nhân của bạn trong vòng 30 ngày, trừ khi cần giữ lại vì mục đích pháp lý.
                </p>
              </div>
            </section>

            {/* Section 10: Changes to Privacy Policy */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">10. Thay đổi chính sách bảo mật</h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>
                  Chúng tôi có thể cập nhật Chính sách bảo mật này theo thời gian để phản ánh những thay đổi trong thực tiễn của chúng tôi hoặc vì các lý do pháp lý, kỹ thuật hoặc kinh doanh khác.
                </p>
                <p>
                  Khi có thay đổi đáng kể, chúng tôi sẽ:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Gửi email thông báo cho bạn</li>
                  <li>Hiển thị thông báo nổi bật trên trang web</li>
                  <li>Cập nhật ngày "Cập nhật lần cuối" ở đầu chính sách này</li>
                </ul>
                <p>
                  Chúng tôi khuyến khích bạn xem lại Chính sách bảo mật này định kỳ để luôn được thông tin về cách chúng tôi bảo vệ thông tin của bạn.
                </p>
              </div>
            </section>

            {/* Section 11: Contact Us */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                11. Liên hệ với chúng tôi
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>Nếu bạn có bất kỳ câu hỏi, thắc mắc hoặc yêu cầu nào liên quan đến Chính sách bảo mật này hoặc việc xử lý dữ liệu cá nhân của bạn, vui lòng liên hệ:</p>
                
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">Email (Ưu tiên):</div>
                        <a href="mailto:support@kenai.id.vn" className="text-blue-600 dark:text-blue-400 hover:underline">support@kenai.id.vn</a>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">Điện thoại:</div>
                        <a href="tel:+84941419617" className="text-blue-600 dark:text-blue-400 hover:underline">0941419617</a>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">Địa chỉ:</div>
                        <p>Phường Hoà Bình, Thành Phố Hải Phòng, Việt Nam</p>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                  Thời gian phản hồi: Chúng tôi cam kết phản hồi mọi yêu cầu liên quan đến quyền riêng tư trong vòng 7-14 ngày làm việc.
                </p>
              </div>
            </section>
          </div>

          {/* Back to top */}
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 text-center">
            <Link 
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
              Quay lại trang chủ
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600 dark:text-gray-400">
            <p>© 2026 KEN AI. Nền tảng quản lý du học thông minh.</p>
            <div className="mt-2 space-x-4 text-sm">
              <Link href="/terms" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Điều khoản dịch vụ</Link>
              <span>•</span>
              <Link href="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Chính sách bảo mật</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
