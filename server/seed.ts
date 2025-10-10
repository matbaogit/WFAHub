import { db } from "./db";
import { templates } from "@shared/schema";

const seedTemplates = [
  {
    name: "Send Email with Attachment",
    nameVi: "Gửi Email kèm File",
    description: "Automatically send emails with file attachments to multiple recipients",
    descriptionVi: "Tự động gửi email với tệp đính kèm đến nhiều người nhận",
    icon: "mail",
    creditCost: 10,
    inputSchema: {
      fields: [
        { name: "to", label: "Địa chỉ email người nhận", type: "email", required: true, placeholder: "example@email.com" },
        { name: "subject", label: "Tiêu đề", type: "text", required: true, placeholder: "Nhập tiêu đề email" },
        { name: "message", label: "Nội dung", type: "textarea", required: true, placeholder: "Nhập nội dung email..." },
        { name: "attachment", label: "Tệp đính kèm", type: "file", required: false }
      ]
    },
    isActive: 1,
  },
  {
    name: "Send Quotation",
    nameVi: "Gửi Báo Giá",
    description: "Create and send professional quotations automatically",
    descriptionVi: "Tạo và gửi báo giá chuyên nghiệp tự động",
    icon: "fileText",
    creditCost: 15,
    inputSchema: {
      fields: [
        { name: "clientEmail", label: "Email khách hàng", type: "email", required: true, placeholder: "client@company.com" },
        { name: "clientName", label: "Tên khách hàng", type: "text", required: true, placeholder: "Tên công ty hoặc cá nhân" },
        { name: "items", label: "Danh sách sản phẩm/dịch vụ", type: "textarea", required: true, placeholder: "Nhập danh sách sản phẩm, mỗi mục trên một dòng" },
        { name: "totalAmount", label: "Tổng giá trị", type: "number", required: true, placeholder: "0" }
      ]
    },
    isActive: 1,
  },
  {
    name: "Schedule Reminder",
    nameVi: "Đặt Lịch Nhắc",
    description: "Set up automatic reminders for important events",
    descriptionVi: "Thiết lập nhắc nhở tự động cho các sự kiện quan trọng",
    icon: "bell",
    creditCost: 5,
    inputSchema: {
      fields: [
        { name: "eventName", label: "Tên sự kiện", type: "text", required: true, placeholder: "Cuộc họp, deadline, v.v." },
        { name: "reminderDate", label: "Ngày nhắc nhở", type: "date", required: true },
        { name: "reminderTime", label: "Giờ nhắc nhở", type: "time", required: true },
        { name: "notes", label: "Ghi chú", type: "textarea", required: false, placeholder: "Thêm ghi chú cho sự kiện..." }
      ]
    },
    isActive: 1,
  },
  {
    name: "Leave Approval",
    nameVi: "Phê Duyệt Nghỉ Phép",
    description: "Automated leave approval workflow",
    descriptionVi: "Quy trình phê duyệt nghỉ phép tự động và nhanh chóng",
    icon: "checkCircle",
    creditCost: 8,
    inputSchema: {
      fields: [
        { name: "employeeName", label: "Tên nhân viên", type: "text", required: true, placeholder: "Nguyễn Văn A" },
        { name: "leaveType", label: "Loại nghỉ phép", type: "text", required: true, placeholder: "Nghỉ phép năm, nghỉ ốm, v.v." },
        { name: "fromDate", label: "Từ ngày", type: "date", required: true },
        { name: "toDate", label: "Đến ngày", type: "date", required: true },
        { name: "reason", label: "Lý do", type: "textarea", required: true, placeholder: "Nhập lý do nghỉ phép..." }
      ]
    },
    isActive: 1,
  },
  {
    name: "Contract Signing",
    nameVi: "Ký Hợp Đồng",
    description: "Send and manage electronic contract signatures",
    descriptionVi: "Gửi và quản lý chữ ký điện tử hợp đồng",
    icon: "fileSignature",
    creditCost: 20,
    inputSchema: {
      fields: [
        { name: "contractTitle", label: "Tiêu đề hợp đồng", type: "text", required: true, placeholder: "Hợp đồng thuê văn phòng" },
        { name: "signerEmail", label: "Email người ký", type: "email", required: true, placeholder: "signer@company.com" },
        { name: "signerName", label: "Tên người ký", type: "text", required: true, placeholder: "Nguyễn Văn B" },
        { name: "contractFile", label: "File hợp đồng", type: "file", required: true },
        { name: "deadline", label: "Hạn ký", type: "date", required: true }
      ]
    },
    isActive: 1,
  },
];

async function seed() {
  console.log("Seeding templates...");
  
  for (const template of seedTemplates) {
    await db.insert(templates).values(template).onConflictDoNothing();
  }
  
  console.log("✓ Templates seeded successfully!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Error seeding database:", error);
  process.exit(1);
});
