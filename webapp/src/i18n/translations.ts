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
    showing: string
    of: string
    notAvailable: string
    saving: string
    updating: string
    both: string
  }

  // Navigation
  nav: {
    dashboard: string
    clients: string
    reminders: string
    staff: string
    config: string
    logout: string
    language: string
  }

  // Config
  config: {
    title: string
    clinicName: string
    clinicAddress: string
    clinicPhone: string
    configUpdated: string
    logo: string
    changeLogo: string
    uploadLogo: string
    removeLogo: string
    pleaseSelectImage: string
    imageSizeLimit: string
    defaultClinicName: string
    logoHint: string
    logoPreview: string
  }

  // Login
  login: {
    title: string
    username: string
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
    overdueCount: string
    today: string
    tomorrow: string
    daysOverdue: string
    priorityHigh: string
    priorityMedium: string
    priorityLow: string
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
    referrer: string
    referrerPlaceholder: string
    hearingAidLeft: string
    hearingAidRight: string
    hearingAidPlaceholder: string
  }

  // Hearing Reports
  hearingReports: {
    title: string
    newReport: string
    editReport: string
    reportDetails: string
    print: string
    normalHearingAbility: string
    decreasedHearingAbility: string
    noReports: string
    client: string
    date: string
    examiner: string
    pureToneAudiometry: string
    speechAudiometry: string
    tympanometry: string
    recommendations: string
    discriminationLoss: string
    tympanograms: string
    results: string
    signature: string
    printName: string
    licenseNo: string
    signatureDate: string
    enterResults: string
    enterRecommendations: string
    enterSignatureName: string
    enterPrintName: string
    enterLicenseNumber: string
    viewAudiogram: string
    createAudiogram: string
    reportUpdated: string
    reportCreated: string
    reportDeleted: string
    failedToSave: string
    failedToDelete: string
    confirmDelete: string
    pleaseSelectClient: string
    invalidClient: string
    clientNotFound: string
    clientEmailNotFound: string
    generatingPdf: string
    clientRequired: string
    invalidClientId: string
    pdfGenerated: string
    pdfGenerationFailed: string
    openingPrintDialog: string
    pdfReadyForEmail: string
    hearingLossAssessment: string
    patientInformation: string
    lastName: string
    firstName: string
    addressStreet: string
    cityTown: string
    telephoneNumber: string
    dateOfBirth: string
    dateOfService: string
    frequency: string
    right: string
    left: string
    dataPoints: string
    addRow: string
    ear: string
    dbHL: string
    recognitionPercent: string
    action: string
    delete: string
    noDataPoints: string
    correctPercent: string
    loss: string
    pressure: string
    admittance: string
    undo: string
    clear: string
    save: string
    shareEmail: string
    downloadPdf: string
    updateReport: string
    createReport: string
    tel: string
    discriminationLossChart: string
    hearingAidSuggested: string
    generatedOn: string
    expandMenu: string
    collapseMenu: string
    syncing: string
    online: string
    offline: string
    checkingConnection: string
    addNew: string
    device: string
    note: string
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
    allStatus: string
    done: string
    markDone: string
    reminderUpdated: string
    reminderDeleted: string
    confirmDelete: string
    reminderDetail: string
    reminderNotFound: string
    deleteReminder: string
    all: string
    typeFollowUpCounseling: string
    typeAudiogramDue: string
    typeMaintenanceDue: string
    typeWarrantyExpiring: string
    typePostRepairCheck: string
    typePostPurchaseSupport: string
    typeClientInactive: string
    typeBirthday: string
    typeRecommendationFollowUp: string
    typeCustom: string
    priorityHigh: string
    priorityMedium: string
    priorityLow: string
    autoGenerated: string
    createdAt: string
    updatedAt: string
    changeStatus: string
    markAsPending: string
    markAsOverdue: string
  }

  // Appointments
  appointments: {
    counselingTitle: string
    editCounselingTitle: string
    currentHearingStatus: string
    clientInfo: string
    counselingDate: string
    counselor: string
    counselingNote: string
    noHearingReports: string
    noDate: string
    selectClient: string
    selectCounselor: string
    counselingCreated: string
    counselingUpdated: string
    selectHearingReport: string
    hearingTestType: string
    repairTitle: string
    editRepairTitle: string
    purchaseTitle: string
    editPurchaseTitle: string
    deviceName: string
    deviceNameRequired: string
    deviceNameRequiredPurchase: string
    selectRepairer: string
    selectBuyer: string
    repairDate: string
    purchaseDate: string
    repairNote: string
    purchaseNote: string
    price: string
    invalidPrice: string
    isPaid: string
    paymentMethod: string
    cash: string
    bankTransfer: string
    paymentCollector: string
    selectPaymentCollector: string
    repairUpdated: string
    repairCreated: string
    purchaseUpdated: string
    purchaseCreated: string
    failedToSaveRepair: string
    failedToSavePurchase: string
    failedToSaveCounseling: string
    noDateAvailable: string
    selectStaff: string
    searchStaff: string
    noStaffFound: string
    phone: string
    email: string
    address: string
    dateOfBirth: string
    counselingContent: string
    enterCounselingContent: string
    enterDeviceName: string
    enterRepairContent: string
    enterPurchaseContent: string
    enterPrice: string
    enterRepairDate: string
    enterPurchaseDate: string
    enterCounselingDate: string
    selectCounselorStaff: string
    updateAppointment: string
    createAppointment: string
  }

  // Client Detail
  clientDetail: {
    patient: string
    patientDetails: string
    inPatientCounselling: string
    editProfile: string
    sex: string
    age: string
    blood: string
    status: string
    department: string
    registeredDate: string
    appointment: string
    bedNumber: string
    bloodPressure: string
    heartRate: string
    glucose: string
    cholesterol: string
    inTheNorm: string
    aboveTheNorm: string
    patientHistory: string
    totalVisits: string
    noReportsYet: string
    createFirstReport: string
    dateOfVisit: string
    diagnosis: string
    severity: string
    totalVisitsCount: string
    documents: string
    download: string
    cured: string
    underTreatment: string
    clientNotFound: string
    clientDeleted: string
    allAppointments: string
    noAppointments: string
    date: string
    type: string
    description: string
    hearingReport: string
    staff: string
    viewReport: string
  }

  // Not Found
  notFound: {
    title: string
    subtitle: string
    message: string
    goToDashboard: string
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
      notAvailable: 'N/A',
      saving: 'Saving...',
      updating: 'Updating...',
      both: 'Both',
    },
    nav: {
      dashboard: 'Dashboard',
      clients: 'Clients',
      reminders: 'Reminders',
      staff: 'Staff',
      config: 'Config',
      logout: 'Logout',
      language: 'Language',
    },
    config: {
      title: 'Clinic Configuration',
      clinicName: 'Clinic Name',
      clinicAddress: 'Clinic Address',
      clinicPhone: 'Clinic Phone',
      configUpdated: 'Configuration updated successfully',
      logo: 'Clinic Logo',
      changeLogo: 'Change Logo',
      uploadLogo: 'Upload Logo',
      removeLogo: 'Remove Logo',
      pleaseSelectImage: 'Please select an image file',
      imageSizeLimit: 'Image size must be less than 5MB',
    },
    login: {
      title: 'Sign In',
      username: 'Username',
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
      overdueCount: 'overdue',
      today: 'Today',
      tomorrow: 'Tomorrow',
      daysOverdue: 'days overdue',
      priorityHigh: 'High',
      priorityMedium: 'Medium',
      priorityLow: 'Low',
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
      referrer: 'Referrer',
      referrerPlaceholder: 'Name of person who referred',
      hearingAidLeft: 'Hearing Aid (Left)',
      hearingAidRight: 'Hearing Aid (Right)',
      hearingAidPlaceholder: 'e.g., Phonak Audeo P90',
    },
    hearingReports: {
      title: 'Hearing Reports',
      newReport: 'New Hearing Report',
      editReport: 'Edit Hearing Report',
      reportDetails: 'Hearing Report Details',
      print: 'Print',
      normalHearingAbility: 'Normal hearing ability',
      decreasedHearingAbility: 'Decreased hearing ability',
      mildHearingLoss: 'Mild Hearing Loss',
      moderateHearingLoss: 'Moderate Hearing Loss',
      severeHearingLoss: 'Severe Hearing Loss',
      profoundHearingLoss: 'Profound Hearing Loss',
      chartInstructions: 'Click on the grid to add/remove hearing threshold points. Drag existing points to adjust values. Right-click on points to delete.',
      rightEar: 'Right Ear',
      leftEar: 'Left Ear',
      noReports: 'No reports found',
      client: 'Client',
      date: 'Date',
      examiner: 'Examiner',
      pureToneAudiometry: 'Pure Tone Audiometry',
      speechAudiometry: 'Speech Audiometry',
      tympanometry: 'Tympanometry',
      recommendations: 'Recommendations',
      discriminationLoss: 'Discrimination Loss',
      tympanograms: 'Tympanograms (Pressure mmH20)',
      results: 'Results',
      signature: 'Signature',
      printName: 'Print Name',
      licenseNo: 'Lic. No',
      signatureDate: 'Date',
      enterResults: 'Enter results summary...',
      enterRecommendations: 'Enter recommendations...',
      enterSignatureName: 'Enter signature name',
      enterPrintName: 'Enter print name',
      enterLicenseNumber: 'Enter license number',
      viewAudiogram: 'View Audiogram',
      createAudiogram: 'Create Audiogram',
      reportUpdated: 'Report updated',
      reportCreated: 'Report created',
      reportDeleted: 'Report deleted',
      failedToSave: 'Failed to save report',
      failedToDelete: 'Failed to delete report',
      confirmDelete: 'Are you sure you want to delete this report? This action cannot be undone.',
      pleaseSelectClient: 'Please select a client',
      invalidClient: 'Invalid client. Please select a valid client from the list.',
      clientNotFound: 'Client not found',
      clientEmailNotFound: 'Client email not found',
      generatingPdf: 'Generating PDF...',
      pdfGenerated: 'PDF generated successfully',
      pdfGenerationFailed: 'Failed to export PDF',
      openingPrintDialog: 'Opening print dialog...',
      pdfReadyForEmail: 'PDF ready. Please attach it manually to the email.',
      hearingLossAssessment: 'Hearing Loss Assessment',
      patientInformation: 'Patient Information',
      lastName: 'Last Name',
      firstName: 'First Name',
      addressStreet: 'Address (Street)',
      cityTown: 'City/Town',
      telephoneNumber: 'Telephone Number',
      dateOfBirth: 'Date of Birth',
      dateOfService: 'Date of Service',
      frequency: 'Frequency (Hz)',
      right: 'Right',
      left: 'Left',
      dataPoints: 'Data Points',
      addRow: '+ Add Row',
      ear: 'Ear',
      dbHL: 'dB HL',
      recognitionPercent: '% Recognition',
      action: 'Action',
      delete: 'Delete',
      noDataPoints: 'No data points. Click "+ Add Row" to add data.',
      correctPercent: 'Correct %',
      loss: 'Loss',
      pressure: 'Pressure (mmH₂O)',
      admittance: 'Admittance',
      undo: 'Undo',
      clear: 'Clear',
      save: 'Save',
      shareEmail: 'Share Email',
      downloadPdf: 'Download PDF',
      updateReport: 'Update Report',
      createReport: 'Create Report',
      tel: 'Tel',
      discriminationLossChart: 'Discrimination Loss Chart',
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
      allStatus: 'All Status',
      done: 'done',
      markDone: 'Mark Done',
      reminderUpdated: 'Reminder updated',
      reminderDeleted: 'Reminder deleted',
      confirmDelete: 'Are you sure you want to delete this reminder?',
      reminderDetail: 'Reminder Detail',
      reminderNotFound: 'Reminder not found',
      deleteReminder: 'Delete Reminder',
      all: 'All',
      typeFollowUpCounseling: 'Follow-up Counseling',
      typeAudiogramDue: 'Audiogram Due',
      typeMaintenanceDue: 'Maintenance Due',
      typeWarrantyExpiring: 'Warranty Expiring',
      typePostRepairCheck: 'Post-Repair Check',
      typePostPurchaseSupport: 'Post-Purchase Support',
      typeClientInactive: 'Client Inactive',
      typeBirthday: 'Birthday',
      typeRecommendationFollowUp: 'Recommendation Follow-up',
      typeCustom: 'Custom',
      priorityHigh: 'High',
      priorityMedium: 'Medium',
      priorityLow: 'Low',
      autoGenerated: 'Auto',
      createdAt: 'Created Date',
      updatedAt: 'Last Updated',
      changeStatus: 'Change Status',
      markAsPending: 'Mark as Pending',
      markAsOverdue: 'Mark as Overdue',
    },
    appointments: {
      counselingTitle: 'Counseling Information',
      editCounselingTitle: 'Edit Counseling Information',
      currentHearingStatus: 'Current Hearing Status',
      clientInfo: 'Client Information',
      counselingDate: 'Counseling Date',
      counselor: 'Counselor',
      counselingNote: 'Counseling Note',
      noHearingReports: 'No hearing reports yet',
      noDate: 'No date',
      selectClient: 'Please select a client',
      selectCounselor: 'Please select a counselor',
      counselingCreated: 'Counseling appointment created',
      counselingUpdated: 'Counseling appointment updated',
      selectHearingReport: 'Select Hearing Report',
      hearingTestType: 'Audiogram',
      repairTitle: 'Repair Information',
      editRepairTitle: 'Edit Repair Information',
      purchaseTitle: 'Purchase Information',
      editPurchaseTitle: 'Edit Purchase Information',
      deviceName: 'Device Name',
      deviceNameRequired: 'Please enter device name',
      selectRepairer: 'Please select repairer',
      selectBuyer: 'Please select buyer',
      repairDate: 'Repair Date',
      purchaseDate: 'Purchase Date',
      repairNote: 'Repair Content',
      purchaseNote: 'Purchase Content',
      price: 'Price',
      invalidPrice: 'Invalid price',
      isPaid: 'Paid',
      paymentMethod: 'Payment Method',
      cash: 'Cash',
      bankTransfer: 'Bank Transfer',
      paymentCollector: 'Payment Collector',
      selectPaymentCollector: 'Select payment collector',
      repairUpdated: 'Repair appointment updated',
      repairCreated: 'Repair appointment created',
      purchaseUpdated: 'Purchase information updated',
      purchaseCreated: 'Purchase information created',
      failedToSaveRepair: 'Failed to save repair appointment',
      failedToSavePurchase: 'Failed to save purchase information',
      failedToSaveCounseling: 'Failed to save counseling appointment',
      noDateAvailable: 'No date available',
      selectStaff: 'Select staff',
      searchStaff: 'Search staff...',
      noStaffFound: 'No staff found',
      phone: 'Phone',
      email: 'Email',
      address: 'Address',
      dateOfBirth: 'Date of Birth',
      counselingContent: 'Counseling Content',
      enterCounselingContent: 'Enter counseling content',
      enterDeviceName: 'Enter device name',
      enterDeviceNamePurchase: 'Enter device name to purchase',
      enterRepairContent: 'Enter repair content',
      enterPurchaseContent: 'Enter purchase content',
      enterPrice: 'Enter price',
      enterRepairDate: 'Enter repair date',
      enterPurchaseDate: 'Enter purchase date',
      enterCounselingDate: 'Enter counseling date',
      selectCounselorStaff: 'Please select counselor staff',
    },
    clientDetail: {
      patient: 'Patient',
      patientDetails: 'Patient Details',
      inPatientCounselling: 'In Patient Counselling',
      editProfile: 'Edit Profile',
      sex: 'Sex',
      age: 'Age',
      blood: 'Blood',
      status: 'Status',
      department: 'Department',
      registeredDate: 'Registered Date',
      appointment: 'Appointment',
      bedNumber: 'Bed Number',
      bloodPressure: 'Blood Pressure',
      heartRate: 'Heart rate',
      glucose: 'Glucose',
      cholesterol: 'Cholesterol',
      inTheNorm: 'In the norm',
      aboveTheNorm: 'Above the norm',
      patientHistory: 'Patient History',
      totalVisits: 'Total {count} Visits',
      noReportsYet: 'No hearing reports yet',
      createFirstReport: 'Create First Report',
      dateOfVisit: 'Date Of Visit',
      diagnosis: 'Diagnosis',
      severity: 'Severity',
      totalVisitsCount: 'Total Visits',
      documents: 'Documents',
      download: 'Download',
      cured: 'Cured',
      underTreatment: 'Under Treatment',
      clientNotFound: 'Client not found',
      clientDeleted: 'Client deleted',
      allAppointments: 'All',
      noAppointments: 'No appointments yet',
      date: 'Date',
      type: 'Type',
      description: 'Description',
      hearingReport: 'Hearing Report',
      staff: 'Staff',
      viewReport: 'View Report',
      hearingAidLeft: 'Hearing Aid (Left)',
      hearingAidRight: 'Hearing Aid (Right)',
      referrer: 'Referrer',
    },
    staff: {
      title: 'Staff Management',
      newStaff: 'New Staff',
      editStaff: 'Edit Staff',
      username: 'Username',
      fullName: 'Full Name',
      email: 'Email',
      role: 'Role',
      staffRole: 'Staff Role',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      createdAt: 'Created At',
      searchPlaceholder: 'Search by username or email...',
      allRoles: 'All Roles',
      noStaffFound: 'No staff found',
      staffCreated: 'Staff created successfully',
      staffUpdated: 'Staff updated successfully',
      staffDeleted: 'Staff deleted successfully',
      technicalSpecialist: 'Technical Specialist',
      consultant: 'Consultant',
      audiologist: 'Audiologist',
      hearingDoctor: 'Hearing Doctor',
      passwordRequired: 'Password is required',
      passwordMinLength: 'Password must be at least 6 characters',
      passwordMismatch: 'Passwords do not match',
      selectRole: 'Select role...',
      leaveBlank: 'Leave blank to keep current',
      required: 'is required',
      staffIdRequired: 'Staff ID is required',
    },
    notFound: {
      title: '404',
      subtitle: 'Page Not Found',
      message: "The page you're looking for doesn't exist.",
      goToDashboard: 'Go to Dashboard',
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
      showing: 'Hiển thị',
      of: 'của',
      notAvailable: 'N/A',
      saving: 'Đang lưu...',
      updating: 'Đang cập nhật...',
      both: 'Cả hai',
    },
    nav: {
      dashboard: 'Bảng điều khiển',
      clients: 'Khách hàng',
      reminders: 'Nhắc nhở',
      staff: 'Nhân viên',
      config: 'Cấu hình',
      logout: 'Đăng xuất',
      language: 'Ngôn ngữ',
    },
    config: {
      title: 'Cấu hình Phòng khám',
      clinicName: 'Tên phòng khám',
      clinicAddress: 'Địa chỉ phòng khám',
      clinicPhone: 'Số điện thoại',
      configUpdated: 'Cập nhật cấu hình thành công',
      logo: 'Logo phòng khám',
      changeLogo: 'Đổi logo',
      uploadLogo: 'Tải logo',
      removeLogo: 'Xóa logo',
      pleaseSelectImage: 'Vui lòng chọn file ảnh',
      imageSizeLimit: 'Kích thước ảnh phải nhỏ hơn 5MB',
      defaultClinicName: 'Hearing Clinic Pro',
      logoHint: 'Khuyến nghị: Định dạng PNG, nền trong suốt, tối đa 5MB',
      logoPreview: 'Xem trước logo',
    },
    login: {
      title: 'Đăng nhập',
      username: 'Tên đăng nhập',
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
      overdueCount: 'quá hạn',
      today: 'Hôm nay',
      tomorrow: 'Ngày mai',
      daysOverdue: 'ngày',
      priorityHigh: 'Cao',
      priorityMedium: 'Trung bình',
      priorityLow: 'Thấp',
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
      referrer: 'Người giới thiệu',
      referrerPlaceholder: 'Tên người giới thiệu',
      hearingAidLeft: 'Loại máy đang đeo bên trái',
      hearingAidRight: 'Loại máy đang đeo bên phải',
      hearingAidPlaceholder: 'Ví dụ: Phonak Audeo P90',
    },
    hearingReports: {
      title: 'Báo cáo thính lực',
      newReport: 'Báo cáo thính lực mới',
      editReport: 'Sửa báo cáo thính lực',
      reportDetails: 'Chi tiết báo cáo thính lực',
      print: 'In',
      normalHearingAbility: 'Khả năng nghe bình thường',
      decreasedHearingAbility: 'Khả năng nghe giảm',
      mildHearingLoss: 'Mất thính lực nhẹ',
      moderateHearingLoss: 'Mất thính lực trung bình',
      severeHearingLoss: 'Mất thính lực nặng',
      profoundHearingLoss: 'Mất thính lực sâu',
      chartInstructions: 'Nhấp vào lưới để thêm/xóa điểm ngưỡng thính lực. Kéo các điểm hiện có để điều chỉnh giá trị. Nhấp chuột phải vào điểm để xóa.',
      rightEar: 'Tai phải',
      leftEar: 'Tai trái',
      noReports: 'Không tìm thấy báo cáo',
      client: 'Khách hàng',
      date: 'Ngày',
      examiner: 'Người khám',
      pureToneAudiometry: 'Đo thính lực đơn âm',
      speechAudiometry: 'Đo thính lực lời nói',
      tympanometry: 'Đo nhĩ lượng',
      recommendations: 'Khuyến nghị',
      discriminationLoss: 'Mất phân biệt',
      tympanograms: 'Đo nhĩ lượng (Áp suất mmH20)',
      results: 'Kết quả',
      signature: 'Chữ ký',
      printName: 'Tên in',
      licenseNo: 'Số giấy phép',
      signatureDate: 'Ngày',
      enterResults: 'Nhập tóm tắt kết quả...',
      enterRecommendations: 'Nhập khuyến nghị...',
      enterSignatureName: 'Nhập tên chữ ký',
      enterPrintName: 'Nhập tên in',
      enterLicenseNumber: 'Nhập số giấy phép',
      viewAudiogram: 'Xem đo thính lực',
      createAudiogram: 'Tạo đo thính lực',
      reportUpdated: 'Đã cập nhật báo cáo',
      reportCreated: 'Đã tạo báo cáo',
      reportDeleted: 'Đã xóa báo cáo',
      failedToSave: 'Không thể lưu báo cáo',
      failedToDelete: 'Không thể xóa báo cáo',
      confirmDelete: 'Bạn có chắc chắn muốn xóa báo cáo này? Hành động này không thể hoàn tác.',
      pleaseSelectClient: 'Vui lòng chọn khách hàng',
      invalidClient: 'Khách hàng không hợp lệ. Vui lòng chọn khách hàng từ danh sách.',
      clientNotFound: 'Không tìm thấy khách hàng',
      clientEmailNotFound: 'Không tìm thấy email khách hàng',
      generatingPdf: 'Đang tạo PDF...',
      clientRequired: 'Khách hàng là bắt buộc',
      invalidClientId: 'ID khách hàng không hợp lệ. Vui lòng chọn khách hàng từ danh sách.',
      pdfGenerated: 'Đã tạo PDF thành công',
      pdfGenerationFailed: 'Không thể xuất PDF',
      openingPrintDialog: 'Đang mở hộp thoại in...',
      pdfReadyForEmail: 'PDF đã sẵn sàng. Vui lòng đính kèm thủ công vào email.',
      hearingLossAssessment: 'Đánh giá Mất thính lực',
      patientInformation: 'Thông tin Bệnh nhân',
      lastName: 'Họ',
      firstName: 'Tên',
      addressStreet: 'Địa chỉ (Đường)',
      cityTown: 'Thành phố/Thị trấn',
      telephoneNumber: 'Số điện thoại',
      dateOfBirth: 'Ngày sinh',
      dateOfService: 'Ngày khám',
      frequency: 'Tần số (Hz)',
      right: 'Phải',
      left: 'Trái',
      dataPoints: 'Điểm dữ liệu',
      addRow: '+ Thêm dòng',
      ear: 'Tai',
      dbHL: 'dB HL',
      recognitionPercent: '% Nhận biết',
      action: 'Thao tác',
      delete: 'Xóa',
      noDataPoints: 'Chưa có điểm dữ liệu. Nhấp "+ Thêm dòng" để thêm dữ liệu.',
      correctPercent: '% Đúng',
      loss: 'Mất',
      pressure: 'Áp suất (mmH₂O)',
      admittance: 'Độ dẫn',
      undo: 'Hoàn tác',
      clear: 'Xóa',
      save: 'Lưu',
      shareEmail: 'Chia sẻ Email',
      downloadPdf: 'Tải PDF',
      updateReport: 'Cập nhật Báo cáo',
      createReport: 'Tạo Báo cáo',
      tel: 'ĐT',
      discriminationLossChart: 'Biểu đồ Mất phân biệt',
      hearingAidSuggested: 'Máy trợ thính đề xuất',
      generatedOn: 'Được tạo vào',
      expandMenu: 'Mở rộng menu',
      collapseMenu: 'Thu gọn menu',
      syncing: 'Đang đồng bộ...',
      online: 'Đang kết nối',
      offline: 'Ngoại tuyến',
      checkingConnection: 'Đang kiểm tra...',
      addNew: 'Thêm mới',
      device: 'Máy',
      note: 'Ghi chú',
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
      allStatus: 'Tất cả trạng thái',
      done: 'đã xong',
      markDone: 'Đánh dấu đã xong',
      reminderUpdated: 'Đã cập nhật nhắc nhở',
      reminderDeleted: 'Đã xóa nhắc nhở',
      confirmDelete: 'Bạn có chắc chắn muốn xóa nhắc nhở này?',
      reminderDetail: 'Chi tiết nhắc nhở',
      reminderNotFound: 'Không tìm thấy nhắc nhở',
      deleteReminder: 'Xóa nhắc nhở',
      all: 'Tất cả',
      typeFollowUpCounseling: 'Tư vấn theo dõi',
      typeAudiogramDue: 'Đo thính lực đến hạn',
      typeMaintenanceDue: 'Bảo trì đến hạn',
      typeWarrantyExpiring: 'Bảo hành sắp hết',
      typePostRepairCheck: 'Kiểm tra sau sửa',
      typePostPurchaseSupport: 'Hỗ trợ sau mua',
      typeClientInactive: 'Khách hàng lâu chưa đến',
      typeBirthday: 'Sinh nhật',
      typeRecommendationFollowUp: 'Theo dõi khuyến nghị',
      typeCustom: 'Tùy chỉnh',
      priorityHigh: 'Cao',
      priorityMedium: 'Trung bình',
      priorityLow: 'Thấp',
      autoGenerated: 'Tự động',
      createdAt: 'Ngày tạo',
      updatedAt: 'Cập nhật lần cuối',
      changeStatus: 'Thay đổi trạng thái',
      markAsPending: 'Đánh dấu Chờ xử lý',
      markAsOverdue: 'Đánh dấu Quá hạn',
    },
    appointments: {
      counselingTitle: 'Thông tin tư vấn thính học',
      editCounselingTitle: 'Sửa thông tin tư vấn thính học',
      currentHearingStatus: 'Thính lực hiện tại',
      clientInfo: 'Thông tin khách hàng',
      counselingDate: 'Ngày tư vấn',
      counselor: 'Người tư vấn',
      counselingNote: 'Nội dung tư vấn',
      noHearingReports: 'Chưa có báo cáo thính lực',
      noDate: 'Không có ngày',
      selectClient: 'Vui lòng chọn khách hàng',
      selectCounselor: 'Vui lòng chọn nhân viên tư vấn',
      counselingCreated: 'Tư vấn thính học đã được tạo',
      counselingUpdated: 'Tư vấn thính học đã được cập nhật',
      selectHearingReport: 'Chọn Báo cáo thính lực',
      hearingTestType: 'Đo thính lực',
      repairTitle: 'Thông tin sửa máy',
      editRepairTitle: 'Sửa thông tin sửa máy',
      purchaseTitle: 'Thông tin mua máy',
      editPurchaseTitle: 'Sửa thông tin mua máy',
      deviceName: 'Tên máy',
      deviceNameRequired: 'Vui lòng nhập tên máy cần sửa',
      deviceNameRequiredPurchase: 'Vui lòng nhập tên máy cần mua',
      selectRepairer: 'Vui lòng chọn người sửa',
      selectBuyer: 'Vui lòng chọn người mua',
      repairDate: 'Ngày sửa',
      purchaseDate: 'Ngày mua',
      repairNote: 'Nội dung sửa',
      purchaseNote: 'Nội dung mua',
      price: 'Giá tiền',
      invalidPrice: 'Giá tiền không hợp lệ',
      isPaid: 'Đã thanh toán',
      paymentMethod: 'Phương thức thanh toán',
      cash: 'Tiền mặt',
      bankTransfer: 'Chuyển khoản',
      paymentCollector: 'Người thu tiền',
      selectPaymentCollector: 'Chọn người thu tiền',
      repairUpdated: 'Thông tin sửa máy đã được cập nhật',
      repairCreated: 'Thông tin sửa máy đã được tạo',
      purchaseUpdated: 'Thông tin mua máy đã được cập nhật',
      purchaseCreated: 'Thông tin mua máy đã được tạo',
      failedToSaveRepair: 'Không thể lưu thông tin sửa máy',
      failedToSavePurchase: 'Không thể lưu thông tin mua máy',
      failedToSaveCounseling: 'Không thể lưu tư vấn thính học',
      noDateAvailable: 'Không có ngày',
      selectStaff: 'Chọn nhân viên',
      searchStaff: 'Tìm kiếm nhân viên...',
      noStaffFound: 'Không tìm thấy nhân viên',
      phone: 'SĐT',
      email: 'Email',
      address: 'Địa chỉ',
      dateOfBirth: 'Ngày sinh',
      counselingContent: 'Nội dung tư vấn',
      enterCounselingContent: 'Nhập nội dung tư vấn',
      enterDeviceName: 'Nhập tên máy cần sửa',
      enterDeviceNamePurchase: 'Nhập tên máy cần mua',
      enterRepairContent: 'Nhập nội dung sửa máy',
      enterPurchaseContent: 'Nhập nội dung mua máy',
      enterPrice: 'Nhập giá tiền',
      enterRepairDate: 'Nhập ngày sửa',
      enterPurchaseDate: 'Nhập ngày mua',
      enterCounselingDate: 'Nhập ngày tư vấn',
      selectCounselorStaff: 'Vui lòng chọn nhân viên tư vấn',
      updateAppointment: 'Cập nhật Lịch hẹn',
      createAppointment: 'Tạo Lịch hẹn',
    },
    clientDetail: {
      patient: 'Bệnh nhân',
      patientDetails: 'Chi tiết bệnh nhân',
      inPatientCounselling: 'Tư vấn bệnh nhân nội trú',
      editProfile: 'Sửa hồ sơ',
      sex: 'Giới tính',
      age: 'Tuổi',
      blood: 'Nhóm máu',
      status: 'Trạng thái',
      department: 'Khoa',
      registeredDate: 'Ngày đăng ký',
      appointment: 'Cuộc hẹn',
      bedNumber: 'Số giường',
      bloodPressure: 'Huyết áp',
      heartRate: 'Nhịp tim',
      glucose: 'Đường huyết',
      cholesterol: 'Cholesterol',
      inTheNorm: 'Bình thường',
      aboveTheNorm: 'Vượt mức bình thường',
      patientHistory: 'Lịch sử bệnh nhân',
      totalVisits: 'Tổng {count} lần thăm khám',
      noReportsYet: 'Chưa có báo cáo thính lực',
      createFirstReport: 'Tạo báo cáo đầu tiên',
      dateOfVisit: 'Ngày thăm khám',
      diagnosis: 'Chẩn đoán',
      severity: 'Mức độ',
      totalVisitsCount: 'Tổng số lần thăm khám',
      documents: 'Tài liệu',
      download: 'Tải xuống',
      cured: 'Đã khỏi',
      underTreatment: 'Đang điều trị',
      clientNotFound: 'Không tìm thấy khách hàng',
      clientDeleted: 'Đã xóa khách hàng',
      allAppointments: 'Tất cả',
      noAppointments: 'Chưa có lịch hẹn nào',
      date: 'Ngày',
      type: 'Loại hẹn',
      description: 'Mô tả',
      hearingReport: 'Báo cáo thính lực',
      staff: 'Nhân viên phụ trách',
      viewReport: 'Xem báo cáo',
      hearingAidLeft: 'Loại máy đang đeo bên trái',
      hearingAidRight: 'Loại máy đang đeo bên phải',
      referrer: 'Người giới thiệu',
    },
    staff: {
      title: 'Quản lý Nhân viên',
      newStaff: 'Nhân viên mới',
      editStaff: 'Sửa Nhân viên',
      username: 'Tên đăng nhập',
      fullName: 'Họ và tên',
      email: 'Email',
      role: 'Vai trò',
      staffRole: 'Chức danh',
      password: 'Mật khẩu',
      confirmPassword: 'Xác nhận mật khẩu',
      createdAt: 'Ngày tạo',
      searchPlaceholder: 'Tìm theo tên đăng nhập hoặc email...',
      allRoles: 'Tất cả chức danh',
      noStaffFound: 'Không tìm thấy nhân viên',
      staffCreated: 'Tạo nhân viên thành công',
      staffUpdated: 'Cập nhật nhân viên thành công',
      staffDeleted: 'Xóa nhân viên thành công',
      technicalSpecialist: 'Chuyên viên kĩ thuật',
      consultant: 'Nhân viên Tư vấn',
      audiologist: 'Chuyên gia thính học',
      hearingDoctor: 'Bác sĩ thính học',
      passwordRequired: 'Mật khẩu là bắt buộc',
      passwordMinLength: 'Mật khẩu phải có ít nhất 6 ký tự',
      passwordMismatch: 'Mật khẩu không khớp',
      selectRole: 'Chọn chức danh...',
      leaveBlank: 'Để trống để giữ nguyên',
      required: 'là bắt buộc',
      staffIdRequired: 'ID nhân viên là bắt buộc',
    },
    notFound: {
      title: '404',
      subtitle: 'Không tìm thấy trang',
      message: 'Trang bạn đang tìm kiếm không tồn tại.',
      goToDashboard: 'Về Bảng điều khiển',
    },
  },
}

