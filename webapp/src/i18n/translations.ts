export type Language = 'vi' | 'en'

export interface Translations {
  // Common
  common: {
    loading: string
    save: string
    cancel: string
    delete: string
    edit: string
    view: string
    create: string
    search: string
    filter: string
    actions: string
    yes: string
    no: string
    close: string
    back: string
    next: string
    previous: string
    submit: string
    reset: string
    confirm: string
  }

  // Navigation
  nav: {
    dashboard: string
    clients: string
    reminders: string
    logout: string
    language: string
  }

  // Login
  login: {
    title: string
    accountName: string
    userId: string
    password: string
    rememberMe: string
    forgotPassword: string
    login: string
    loggingIn: string
    loginSuccessful: string
    loginFailed: string
    cantAccessAccount: string
    sendResetEmail: string
    passwordResetSent: string
    backToLogin: string
  }

  // Dashboard
  dashboard: {
    title: string
    newClient: string
    newHearingReport: string
    upcomingReminders: string
    noUpcomingReminders: string
    recentClients: string
    noClients: string
    viewAllReminders: string
    viewAllClients: string
    client: string
    due: string
    lastVisit: string
  }

  // Clients
  clients: {
    title: string
    newClient: string
    editClient: string
    clientDetails: string
    allClients: string
    activeOnly: string
    inactiveOnly: string
    noClientsFound: string
    searchPlaceholder: string
    firstName: string
    lastName: string
    fullName: string
    dateOfBirth: string
    gender: string
    phone: string
    email: string
    address: string
    notes: string
    isActive: string
    selectGender: string
    male: string
    female: string
    other: string
    staff: string
    lastVisitDate: string
    dob: string
    name: string
  }

  // Hearing Reports
  hearingReports: {
    title: string
    newReport: string
    editReport: string
    reportDetails: string
    print: string
    noReports: string
    client: string
    date: string
    examiner: string
    pureToneAudiometry: string
    speechAudiometry: string
    tympanometry: string
    recommendations: string
  }

  // Reminders
  reminders: {
    title: string
    newReminder: string
    editReminder: string
    noReminders: string
    status: string
    pending: string
    completed: string
    overdue: string
    dueDate: string
    titleLabel: string
    description: string
  }
}

export const translations: Record<Language, Translations> = {
  en: {
    common: {
      loading: 'Loading...',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      view: 'View',
      create: 'Create',
      search: 'Search',
      filter: 'Filter',
      actions: 'Actions',
      yes: 'Yes',
      no: 'No',
      close: 'Close',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      submit: 'Submit',
      reset: 'Reset',
      confirm: 'Confirm',
    },
    nav: {
      dashboard: 'Dashboard',
      clients: 'Clients',
      reminders: 'Reminders',
      logout: 'Logout',
      language: 'Language',
    },
    login: {
      title: 'Sign In',
      accountName: 'Account Name',
      userId: 'User ID',
      password: 'Password',
      rememberMe: 'Remember me',
      forgotPassword: 'Forgot Password?',
      login: 'Log In',
      loggingIn: 'Logging in...',
      loginSuccessful: 'Login successful!',
      loginFailed: 'Login failed',
      cantAccessAccount: "Can't access your account?",
      sendResetEmail: 'Send Reset Email',
      passwordResetSent: 'Password reset email sent!',
      backToLogin: 'Back to login',
    },
    dashboard: {
      title: 'Dashboard',
      newClient: 'New Client',
      newHearingReport: 'New Hearing Report',
      upcomingReminders: 'Upcoming Reminders',
      noUpcomingReminders: 'No upcoming reminders',
      recentClients: 'Recent Clients',
      noClients: 'No clients yet',
      viewAllReminders: 'View all reminders',
      viewAllClients: 'View all clients',
      client: 'Client',
      due: 'Due',
      lastVisit: 'Last visit',
    },
    clients: {
      title: 'Clients',
      newClient: 'New Client',
      editClient: 'Edit Client',
      clientDetails: 'Client Details',
      allClients: 'All Clients',
      activeOnly: 'Active Only',
      inactiveOnly: 'Inactive Only',
      noClientsFound: 'No clients found',
      searchPlaceholder: 'Search by name, phone, or email...',
      firstName: 'First Name',
      lastName: 'Last Name',
      fullName: 'Full Name',
      dateOfBirth: 'Date of Birth',
      gender: 'Gender',
      phone: 'Phone',
      email: 'Email',
      address: 'Address',
      notes: 'Notes',
      isActive: 'Active',
      selectGender: 'Select...',
      male: 'Male',
      female: 'Female',
      other: 'Other',
      staff: 'Staff',
      lastVisitDate: 'Last Visit Date',
      dob: 'DOB',
      name: 'Name',
    },
    hearingReports: {
      title: 'Hearing Reports',
      newReport: 'New Hearing Report',
      editReport: 'Edit Hearing Report',
      reportDetails: 'Hearing Report Details',
      print: 'Print',
      noReports: 'No reports found',
      client: 'Client',
      date: 'Date',
      examiner: 'Examiner',
      pureToneAudiometry: 'Pure Tone Audiometry',
      speechAudiometry: 'Speech Audiometry',
      tympanometry: 'Tympanometry',
      recommendations: 'Recommendations',
    },
    reminders: {
      title: 'Reminders',
      newReminder: 'New Reminder',
      editReminder: 'Edit Reminder',
      noReminders: 'No reminders found',
      status: 'Status',
      pending: 'pending',
      completed: 'completed',
      overdue: 'overdue',
      dueDate: 'Due Date',
      titleLabel: 'Title',
      description: 'Description',
    },
  },
  vi: {
    common: {
      loading: 'Đang tải...',
      save: 'Lưu',
      cancel: 'Hủy',
      delete: 'Xóa',
      edit: 'Sửa',
      view: 'Xem',
      create: 'Tạo mới',
      search: 'Tìm kiếm',
      filter: 'Lọc',
      actions: 'Thao tác',
      yes: 'Có',
      no: 'Không',
      close: 'Đóng',
      back: 'Quay lại',
      next: 'Tiếp theo',
      previous: 'Trước',
      submit: 'Gửi',
      reset: 'Đặt lại',
      confirm: 'Xác nhận',
    },
    nav: {
      dashboard: 'Bảng điều khiển',
      clients: 'Khách hàng',
      reminders: 'Nhắc nhở',
      logout: 'Đăng xuất',
      language: 'Ngôn ngữ',
    },
    login: {
      title: 'Đăng nhập',
      accountName: 'Tên tài khoản',
      userId: 'Mã người dùng',
      password: 'Mật khẩu',
      rememberMe: 'Ghi nhớ đăng nhập',
      forgotPassword: 'Quên mật khẩu?',
      login: 'Đăng nhập',
      loggingIn: 'Đang đăng nhập...',
      loginSuccessful: 'Đăng nhập thành công!',
      loginFailed: 'Đăng nhập thất bại',
      cantAccessAccount: 'Không thể truy cập tài khoản?',
      sendResetEmail: 'Gửi email đặt lại mật khẩu',
      passwordResetSent: 'Đã gửi email đặt lại mật khẩu!',
      backToLogin: 'Quay lại đăng nhập',
    },
    dashboard: {
      title: 'Bảng điều khiển',
      newClient: 'Khách hàng mới',
      newHearingReport: 'Báo cáo thính lực mới',
      upcomingReminders: 'Nhắc nhở sắp tới',
      noUpcomingReminders: 'Không có nhắc nhở nào',
      recentClients: 'Khách hàng gần đây',
      noClients: 'Chưa có khách hàng',
      viewAllReminders: 'Xem tất cả nhắc nhở',
      viewAllClients: 'Xem tất cả khách hàng',
      client: 'Khách hàng',
      due: 'Đến hạn',
      lastVisit: 'Lần thăm khám cuối',
    },
    clients: {
      title: 'Khách hàng',
      newClient: 'Khách hàng mới',
      editClient: 'Sửa khách hàng',
      clientDetails: 'Chi tiết khách hàng',
      allClients: 'Tất cả khách hàng',
      activeOnly: 'Chỉ khách hàng hoạt động',
      inactiveOnly: 'Chỉ khách hàng không hoạt động',
      noClientsFound: 'Không tìm thấy khách hàng',
      searchPlaceholder: 'Tìm theo tên, số điện thoại hoặc email...',
      firstName: 'Tên',
      lastName: 'Họ',
      fullName: 'Họ và tên',
      dateOfBirth: 'Ngày sinh',
      gender: 'Giới tính',
      phone: 'Số điện thoại',
      email: 'Email',
      address: 'Địa chỉ',
      notes: 'Ghi chú',
      isActive: 'Hoạt động',
      selectGender: 'Chọn...',
      male: 'Nam',
      female: 'Nữ',
      other: 'Khác',
      staff: 'Nhân viên',
      lastVisitDate: 'Ngày thăm khám cuối',
      dob: 'Ngày sinh',
      name: 'Tên',
    },
    hearingReports: {
      title: 'Báo cáo thính lực',
      newReport: 'Báo cáo thính lực mới',
      editReport: 'Sửa báo cáo thính lực',
      reportDetails: 'Chi tiết báo cáo thính lực',
      print: 'In',
      noReports: 'Không tìm thấy báo cáo',
      client: 'Khách hàng',
      date: 'Ngày',
      examiner: 'Người khám',
      pureToneAudiometry: 'Đo thính lực đơn âm',
      speechAudiometry: 'Đo thính lực lời nói',
      tympanometry: 'Đo nhĩ lượng',
      recommendations: 'Khuyến nghị',
    },
    reminders: {
      title: 'Nhắc nhở',
      newReminder: 'Nhắc nhở mới',
      editReminder: 'Sửa nhắc nhở',
      noReminders: 'Không tìm thấy nhắc nhở',
      status: 'Trạng thái',
      pending: 'chờ xử lý',
      completed: 'hoàn thành',
      overdue: 'quá hạn',
      dueDate: 'Ngày đến hạn',
      titleLabel: 'Tiêu đề',
      description: 'Mô tả',
    },
  },
}

