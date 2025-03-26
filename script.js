import { auth, db, signInWithPopup, GoogleAuthProvider, collection, addDoc, query, orderBy, onSnapshot } from "./firebaseConfig.js";

// عند تحميل الصفحة، تحقق من تسجيل الدخول ثم حمّل البيانات
document.addEventListener("DOMContentLoaded", function () {
    checkLogin();
    loadOnlineUsers();
    loadGroups();
});

// التحقق من تسجيل الدخول
function checkLogin() {
    let username = localStorage.getItem("currentUser");
    if (username) {
        document.getElementById("loginScreen").classList.add("hidden");
        document.getElementById("chatApp").classList.remove("hidden");
        loadMessages();
    }
}

// تسجيل الدخول باستخدام اسم مستخدم يدويًا
function login() {
    let username = document.getElementById("username").value.trim();
    if (username === "") {
        alert("يرجى إدخال اسم المستخدم");
        return;
    }

    localStorage.setItem("currentUser", username);
    document.getElementById("loginScreen").classList.add("hidden");
    document.getElementById("chatApp").classList.remove("hidden");

    loadMessages();
}

// تسجيل الدخول باستخدام حساب Google
function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
        .then((result) => {
            localStorage.setItem("currentUser", result.user.displayName);
            document.getElementById("loginScreen").classList.add("hidden");
            document.getElementById("chatApp").classList.remove("hidden");
            loadMessages();
        })
        .catch((error) => {
            console.error("خطأ أثناء تسجيل الدخول:", error);
        });
}

// إرسال رسالة إلى Firestore
async function sendMessage() {
    const messageInput = document.getElementById("messageInput");
    if (!messageInput.value.trim()) return;

    try {
        await addDoc(collection(db, "messages"), {
            user: localStorage.getItem("currentUser"),
            text: messageInput.value,
            timestamp: new Date(),
        });
        messageInput.value = "";
    } catch (error) {
        console.error("خطأ في إرسال الرسالة:", error);
    }
}

// تحميل الرسائل من Firestore في الوقت الفعلي
function loadMessages() {
    const chatBox = document.getElementById("chatBox");
    const q = query(collection(db, "messages"), orderBy("timestamp"));

    onSnapshot(q, (snapshot) => {
        chatBox.innerHTML = "";
        snapshot.forEach((doc) => {
            let msg = doc.data();
            let msgElement = document.createElement("p");
            msgElement.textContent = `${msg.user}: ${msg.text}`;
            chatBox.appendChild(msgElement);
        });
        chatBox.scrollTop = chatBox.scrollHeight;
    });
}

// عرض المستخدمين المتصلين (مثال: من Firestore)
function loadOnlineUsers() {
    const usersRef = collection(db, "users"); // على سبيل المثال إذا كانت بيانات المستخدمين في collection "users"
    const q = query(usersRef); // يمكنك إضافة أي استعلامات إضافية هنا مثل التصفية أو الترتيب

    onSnapshot(q, (snapshot) => {
        const usersList = document.getElementById("onlineUsers");
        usersList.innerHTML = "";
        snapshot.forEach((doc) => {
            let user = doc.data();
            let li = document.createElement("li");
            li.textContent = user.name;
            li.onclick = () => alert("بدء محادثة مع " + user.name);
            usersList.appendChild(li);
        });
    });
}

// عرض القروبات (مثال: من Firestore)
function loadGroups() {
    const groupsRef = collection(db, "groups"); // على سبيل المثال إذا كانت بيانات القروبات في collection "groups"
    const q = query(groupsRef); // يمكنك إضافة أي استعلامات إضافية هنا مثل التصفية أو الترتيب

    onSnapshot(q, (snapshot) => {
        const groupsList = document.getElementById("groupsList");
        groupsList.innerHTML = "";
        snapshot.forEach((doc) => {
            let group = doc.data();
            let li = document.createElement("li");
            li.textContent = group.name;
            li.onclick = () => alert("تم الانضمام إلى " + group.name);
            groupsList.appendChild(li);
        });
    });
}

// البحث عن مستخدم (مثال)
function searchUser() {
    let username = document.getElementById("searchUser").value;
    alert("البحث عن المستخدم: " + username);
}

// فتح دردشة عشوائية
function openChat() {
    alert("تم بدء دردشة عشوائية...");
}

// فتح الإعدادات
function openSettings() {
    alert("فتح الإعدادات...");
}

// تصدير الدوال لاستخدامها في `index.html`
window.login = login;
window.loginWithGoogle = loginWithGoogle;
window.sendMessage = sendMessage;
window.searchUser = searchUser;
window.openChat = openChat;
window.openSettings = openSettings;
