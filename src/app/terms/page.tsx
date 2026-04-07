import Link from 'next/link'
import { Sparkles, ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Điều khoản dịch vụ | KEN AI',
  description: 'Điều khoản dịch vụ của nền tảng quản lý du học thông minh KEN AI',
}

export default function TermsPage() {
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
              Điều khoản dịch vụ
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Cập nhật lần cuối: Ngày 06 tháng 04 năm 2026
            </p>
          </div>

          <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
            {/* Section 1: Introduction */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm">1</span>
                Giới thiệu
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>
                  Chào mừng bạn đến với KEN AI - Nền tảng quản lý du học thông minh. Các Điều khoản dịch vụ này ("Điều khoản") điều chỉnh việc bạn truy cập và sử dụng nền tảng, dịch vụ và ứng dụng của chúng tôi (gọi chung là "Dịch vụ").
                </p>
                <p>
                  Bằng cách truy cập hoặc sử dụng Dịch vụ của chúng tôi, bạn đồng ý bị ràng buộc bởi các Điều khoản này. Nếu bạn không đồng ý với bất kỳ phần nào của các Điều khoản này, bạn không được phép truy cập hoặc sử dụng Dịch vụ.
                </p>
              </div>
            </section>

            {/* Section 2: Definitions */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 text-sm">2</span>
                Định nghĩa
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-3">
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>"Công ty"</strong>, <strong>"chúng tôi"</strong>, <strong>"của chúng tôi"</strong>: Đề cập đến KEN AI.</li>
                  <li><strong>"Người dùng"</strong>, <strong>"bạn"</strong>: Cá nhân hoặc tổ chức truy cập hoặc sử dụng Dịch vụ.</li>
                  <li><strong>"Nội dung"</strong>: Văn bản, hình ảnh, dữ liệu và tài liệu khác mà bạn tải lên hoặc tạo ra thông qua Dịch vụ.</li>
                  <li><strong>"Dữ liệu cá nhân"</strong>: Thông tin có thể nhận dạng cá nhân theo quy định của pháp luật Việt Nam.</li>
                </ul>
              </div>
            </section>

            {/* Section 3: Account Registration */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 text-sm">3</span>
                Đăng ký tài khoản
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>Để sử dụng một số tính năng của Dịch vụ, bạn cần đăng ký tài khoản. Khi đăng ký, bạn cam kết:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Cung cấp thông tin chính xác, đầy đủ và cập nhật</li>
                  <li>Bảo mật thông tin đăng nhập và chịu trách nhiệm về mọi hoạt động dưới tài khoản của mình</li>
                  <li>Thông báo ngay cho chúng tôi nếu phát hiện vi phạm bảo mật hoặc sử dụng trái phép</li>
                  <li>Chỉ sử dụng tài khoản cho mục đích hợp pháp và phù hợp với Điều khoản này</li>
                </ul>
                <p className="text-red-600 dark:text-red-400 font-medium">
                  Chúng tôi có quyền đình chỉ hoặc chấm dứt tài khoản nếu phát hiện vi phạm các điều khoản này.
                </p>
              </div>
            </section>

            {/* Section 4: User Responsibilities */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 text-sm">4</span>
                Trách nhiệm người dùng
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>Khi sử dụng Dịch vụ, bạn đồng ý KHÔNG:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Sử dụng Dịch vụ cho mục đích bất hợp pháp hoặc vi phạm pháp luật Việt Nam</li>
                  <li>Tải lên nội dung độc hại, lừa đảo, khiêu dâm, bạo lực hoặc vi phạm quyền riêng tư của người khác</li>
                  <li>Cố gắng truy cập trái phép vào hệ thống, tài khoản của người dùng khác hoặc can thiệp vào hoạt động bình thường của Dịch vụ</li>
                  <li>Sao chép, sửa đổi, phân phối ngược hoặc khai thác thương mại Dịch vụ mà không có sự cho phép bằng văn bản</li>
                  <li>Sử dụng bot, scraper hoặc công cụ tự động khác để truy cập Dịch vụ</li>
                  <li>Chia sẻ thông tin sai lệch về chương trình du học, visa hoặc thủ tục liên quan</li>
                </ul>
              </div>
            </section>

            {/* Section 5: Intellectual Property */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 text-sm">5</span>
                Quyền sở hữu trí tuệ
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>
                  Tất cả nội dung, tính năng và chức năng của Dịch vụ (bao gồm nhưng không giới hạn ở thông tin, phần mềm, văn bản, hiển thị, hình ảnh, video và âm thanh, cũng như thiết kế, lựa chọn và sắp xếp của chúng) đều thuộc sở hữu của KEN AI, nhà cung cấp giấy phép của chúng tôi hoặc các nhà cung cấp nội dung khác và được bảo vệ bởi luật bản quyền, nhãn hiệu, bằng sáng chế, bí mật thương mại và các luật khác.
                </p>
                <p>
                  Bạn được cấp giấy phép hạn chế, không độc quyền, không thể chuyển nhượng để truy cập và sử dụng Dịch vụ cho mục đích cá nhân hoặc nội bộ của tổ chức bạn, tuân thủ các Điều khoản này.
                </p>
              </div>
            </section>

            {/* Section 6: Data Collection & Usage */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 text-sm">6</span>
                Thu thập và sử dụng dữ liệu
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>
                  Chúng tôi thu thập và xử lý dữ liệu cá nhân theo Chính sách bảo mật của chúng tôi. Bằng cách sử dụng Dịch vụ, bạn đồng ý với việc thu thập và sử dụng thông tin theo Chính sách bảo mật.
                </p>
                <p>Chúng tôi có thể thu thập:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Thông tin tài khoản (tên, email, vai trò trong tổ chức)</li>
                  <li>Dữ liệu hồ sơ học sinh (thông tin cá nhân, tài liệu, tiến trình visa)</li>
                  <li>Dữ liệu sử dụng (log truy cập, tương tác với AI, hiệu suất hệ thống)</li>
                  <li>Thông tin thanh toán (được xử lý bởi bên thứ ba an toàn)</li>
                </ul>
                <p>
                  Vui lòng xem <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">Chính sách bảo mật</Link> để biết thêm chi tiết.
                </p>
              </div>
            </section>

            {/* Section 7: Security Measures */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-sm">7</span>
                Biện pháp bảo mật
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>Chúng tôi cam kết bảo vệ dữ liệu của bạn thông qua:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Mã hóa dữ liệu end-to-end (AES-256)</li>
                  <li>Xác thực hai yếu tố (2FA) tùy chọn</li>
                  <li>Kiểm soát truy cập dựa trên vai trò (RBAC)</li>
                  <li>Sao lưu dữ liệu tự động hàng ngày</li>
                  <li>Giám sát bảo mật 24/7 và phát hiện xâm nhập</li>
                  <li>Tuân thủ tiêu chuẩn bảo mật quốc tế (ISO 27001, GDPR)</li>
                </ul>
                <p className="text-yellow-700 dark:text-yellow-400">
                  Mặc dù chúng tôi thực hiện các biện pháp bảo mật hợp lý, không có phương thức truyền tải qua Internet hoặc lưu trữ điện tử nào là 100% an toàn. Chúng tôi không thể đảm bảo bảo mật tuyệt đối.
                </p>
              </div>
            </section>

            {/* Section 8: Pricing & Payment */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-600 dark:text-pink-400 text-sm">8</span>
                Giá cả và thanh toán
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>
                  KEN AI cung cấp các gói dịch vụ linh hoạt dựa trên số lượng hồ sơ học sinh quản lý. Giá cả được công bố rõ ràng trên trang chủ và có thể thay đổi theo thời gian.
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Gói Starter: Miễn phí (tối đa 2 hồ sơ)</li>
                  <li>Gói Standard: 1.500.000đ/tháng (15 hồ sơ)</li>
                  <li>Gói Professional: 2.670.000đ/tháng (30 hồ sơ)</li>
                  <li>Gói Enterprise: 6.320.000đ/tháng (80 hồ sơ)</li>
                  <li>Gói Tập đoàn: Liên hệ để báo giá tùy chỉnh</li>
                </ul>
                <p>
                  Thanh toán được thực hiện hàng tháng. Bạn có thể hủy bất cứ lúc nào và sẽ không bị tính phí cho chu kỳ tiếp theo.
                </p>
              </div>
            </section>

            {/* Section 9: Limitation of Liability */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400 text-sm">9</span>
                Giới hạn trách nhiệm
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>
                  Trong phạm vi tối đa được phép bởi luật pháp hiện hành, KEN AI và các giám đốc, nhân viên, đối tác, đại lý, nhà cung cấp hoặc công ty con của chúng tôi sẽ không chịu trách nhiệm về bất kỳ thiệt hại gián tiếp, ngẫu nhiên, đặc biệt, do hậu quả hoặc trừng phạt nào, bao gồm nhưng không giới hạn ở mất lợi nhuận, dữ liệu, sử dụng, uy tín hoặc các tổn thất vô hình khác.
                </p>
                <p>
                  Tổng trách nhiệm của chúng tôi đối với bạn cho tất cả khiếu nại phát sinh từ hoặc liên quan đến việc sử dụng Dịch vụ sẽ không vượt quá số tiền bạn đã trả cho chúng tôi trong 12 tháng trước đó.
                </p>
              </div>
            </section>

            {/* Section 10: Termination */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 text-sm">10</span>
                Chấm dứt dịch vụ
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>
                  Chúng tôi có thể chấm dứt hoặc đình chỉ quyền truy cập của bạn vào Dịch vụ ngay lập tức, mà không cần thông báo trước hoặc chịu trách nhiệm, vì bất kỳ lý do gì, bao gồm nhưng không giới hạn ở vi phạm các Điều khoản này.
                </p>
                <p>
                  Khi chấm dứt, quyền sử dụng Dịch vụ của bạn sẽ ngừng ngay lập tức. Tất cả các điều khoản của Điều khoản này vẫn có hiệu lực sau khi chấm dứt, bao gồm các điều khoản về sở hữu trí tuệ, giới hạn trách nhiệm và luật áp dụng.
                </p>
              </div>
            </section>

            {/* Section 11: Changes to Terms */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 text-sm">11</span>
                Thay đổi điều khoản
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>
                  Chúng tôi có quyền sửa đổi hoặc thay thế các Điều khoản này bất cứ lúc nào theo quyết định riêng của mình. Nếu sửa đổi là đáng kể, chúng tôi sẽ cố gắng cung cấp thông báo ít nhất 30 ngày trước khi các điều khoản mới có hiệu lực.
                </p>
                <p>
                  Bằng cách tiếp tục truy cập hoặc sử dụng Dịch vụ của chúng tôi sau khi bất kỳ sửa đổi nào có hiệu lực, bạn đồng ý bị ràng buộc bởi các điều khoản đã sửa đổi.
                </p>
              </div>
            </section>

            {/* Section 12: Governing Law */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-sm">12</span>
                Luật áp dụng và giải quyết tranh chấp
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>
                  Các Điều khoản này sẽ được điều chỉnh và hiểu theo luật pháp của Cộng hòa Xã hội Chủ nghĩa Việt Nam, mà không xét đến các nguyên tắc xung đột pháp luật.
                </p>
                <p>
                  Mọi tranh chấp phát sinh từ hoặc liên quan đến các Điều khoản này sẽ được giải quyết thông qua thương lượng友好. Nếu không thể đạt được thỏa thuận, tranh chấp sẽ được đưa ra Tòa án nhân dân có thẩm quyền tại Thành phố Hải Phòng, Việt Nam.
                </p>
              </div>
            </section>

            {/* Section 13: Contact Information */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm">13</span>
                Thông tin liên hệ
              </h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-4">
                <p>Nếu bạn có bất kỳ câu hỏi nào về các Điều khoản dịch vụ này, vui lòng liên hệ với chúng tôi:</p>
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <span className="font-semibold min-w-[80px]">Email:</span>
                      <a href="mailto:support@kenai.id.vn" className="text-blue-600 dark:text-blue-400 hover:underline">support@kenai.id.vn</a>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="font-semibold min-w-[80px]">Điện thoại:</span>
                      <a href="tel:+84941419617" className="text-blue-600 dark:text-blue-400 hover:underline">0941419617</a>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="font-semibold min-w-[80px]">Địa chỉ:</span>
                      <span>Phường Hoà Bình, Thành Phố Hải Phòng, Việt Nam</span>
                    </li>
                  </ul>
                </div>
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
