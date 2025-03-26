import { auth, db, signInWithPopup, GoogleAuthProvider, collection, addDoc, query, orderBy, onSnapshot, updateDoc, doc, deleteDoc, where } from "./firebaseConfig.js";

// عند تحميل الصفحة، تحقق من تسجيل الدخول ثم حمّل البيانات
document.addEventListener("DOMContentLoaded", function () {
    checkLogin();
    loadOnlineUsers();
    loadGroups();
    loadMessages(); // تحميل الرسائل للمجموعات أو المحادثات العامة
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
async function sendMessage(groupId = null) {
    const messageInput = document.getElementById("messageInput");
    if (!messageInput.value.trim()) return;

    const messageData = {
        user: localStorage.getItem("currentUser"),
        text: messageInput.value,
        timestamp: new Date(),
        groupId: groupId || "general",  // إذا لم يتم تحديد مجموعة، تكون الرسالة للمجموعة العامة
    };

    try {
        await addDoc(collection(db, "messages"), messageData);
        messageInput.value = "";
    } catch (error) {
        console.error("خطأ في إرسال الرسالة:", error);
        showError("حدث خطأ أثناء إرسال الرسالة.");
    }
}

// تحميل الرسائل من Firestore في الوقت الفعلي
function loadMessages(groupId = null) {
    const chatBox = document.getElementById("chatBox");
    const q = query(
        collection(db, "messages"),
        orderBy("timestamp"),
        groupId ? where("groupId", "==", groupId) : []
    );

    onSnapshot(q, (snapshot) => {
        chatBox.innerHTML = "";
        snapshot.forEach((doc) => {
            let msg = doc.data();
            let msgElement = document.createElement("div");
            msgElement.textContent = `${msg.user}: ${msg.text}`;

            // إضافة أزرار تعديل وحذف
            let editBtn = document.createElement("button");
            editBtn.textContent = "تعديل";
            editBtn.onclick = () => {
                let newText = prompt("أدخل النص الجديد:", msg.text);
                if (newText) {
                    editMessage(doc.id, newText);
                }
            };

            let deleteBtn = document.createElement("button");
            deleteBtn.textContent = "حذف";
            deleteBtn.onclick = () => deleteMessage(doc.id);

            msgElement.appendChild(editBtn);
            msgElement.appendChild(deleteBtn);

            chatBox.appendChild(msgElement);
        });
        chatBox.scrollTop = chatBox.scrollHeight;
    });
}

// تعديل الرسالة
async function editMessage(messageId, newText) {
    try {
        const messageRef = doc(db, "messages", messageId);
        await updateDoc(messageRef, {
            text: newText,
        });
    } catch (error) {
        console.error("خطأ في تعديل الرسالة:", error);
        showError("حدث خطأ أثناء تعديل الرسالة.");
    }
}

// حذف الرسالة
async function deleteMessage(messageId) {
    try {
        await deleteDoc(doc(db, "messages", messageId));
    } catch (error) {
        console.error("خطأ في حذف الرسالة:", error);
        showError("حدث خطأ أثناء حذف الرسالة.");
    }
}

// عرض المستخدمين المتصلين (مثال: من Firestore)
function loadOnlineUsers() {
    const usersRef = collection(db, "users");
    const q = query(usersRef);

    onSnapshot(q, (snapshot) => {
        const usersList = document.getElementById("onlineUsers");
        usersList.innerHTML = "";
        snapshot.forEach((doc) => {
            let user = doc.data();
            let li = document.createElement("li");
            li.textContent = `${user.name} - ${user.online ? "موجود" : "غير موجود"}`;
            li.onclick = () => alert("بدء محادثة مع " + user.name);
            usersList.appendChild(li);
        });
    });
}

// تحديث حالة الاتصال للمستخدمين
function updateOnlineStatus(status) {
    const userRef = doc(db, "users", localStorage.getItem("currentUser"));
    updateDoc(userRef, {
        online: status,
    });
}

// عرض القروبات (مثال: من Firestore)
function loadGroups() {
    const groupsRef = collection(db, "groups");
    const q = query(groupsRef);

    onSnapshot(q, (snapshot) => {
        const groupsList = document.getElementById("groupsList");
        groupsList.innerHTML = "";
        snapshot.forEach((doc) => {
            let group = doc.data();
            let li = document.createElement("li");
            li.textContent = group.name;
            li.onclick = () => loadMessages(group.id); // فتح الرسائل الخاصة بالقروب
            groupsList.appendChild(li);
        });
    });
}

// عرض رسالة خطأ
function showError(message) {
    const messageBox = document.createElement("div");
    messageBox.textContent = message;
    messageBox.className = "message-box error";
    document.body.appendChild(messageBox);
    setTimeout(() => messageBox.remove(), 3000);
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
