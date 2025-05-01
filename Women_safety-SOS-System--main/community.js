document.addEventListener("DOMContentLoaded", () => {
    initLottieAnimation();
    initCommunityPosts();
    initChat();

    // === Lottie Animation ===
    function initLottieAnimation() {
        const animationContainer = document.getElementById("community-animation");
        const fallbackImage = document.getElementById("fallback-image");

        if (!animationContainer) return;

        try {
            lottie.loadAnimation({
                container: animationContainer,
                renderer: "svg",
                loop: true,
                autoplay: true,
                path: "k.json",
                rendererSettings: {
                    preserveAspectRatio: "xMidYMid slice",
                },
            });
        } catch (error) {
            console.error("Lottie animation failed to load:", error);
            if (fallbackImage) {
                fallbackImage.style.display = "block";
                animationContainer.style.display = "none";
            }
        }
    }

    // === Community Posts Section ===
    function initCommunityPosts() {
        const postButton = document.getElementById("postButton");
        const postInput = document.getElementById("postInput");
        const postsContainer = document.getElementById("postsContainer");

        if (!postButton || !postInput || !postsContainer) return;

        loadPosts();

        postButton.addEventListener("click", () => {
            const text = postInput.value.trim();
            if (!text) return;

            const postId = Date.now();
            const newPost = createPostElement(postId, text, []);
            postsContainer.appendChild(newPost);
            postInput.value = "";
            savePosts();
            postsContainer.scrollLeft = postsContainer.scrollWidth;
        });

        function createPostElement(postId, text, comments) {
            const postDiv = document.createElement("div");
            postDiv.classList.add("post");
            postDiv.innerHTML = `
                <p>${text}</p>
                <textarea id="commentInput-${postId}" class="comment-input" placeholder="Write a comment..."></textarea>
                <button class="comment-btn" data-post-id="${postId}">Comment</button>
                <div id="comments-${postId}" class="comment-section"></div>
            `;

            postDiv.querySelector(".comment-btn").addEventListener("click", () => saveComment(postId));

            const commentsContainer = postDiv.querySelector(`#comments-${postId}`);
            comments.forEach(comment => {
                commentsContainer.appendChild(createCommentElement(comment));
            });

            return postDiv;
        }

        function createCommentElement(commentText) {
            const commentDiv = document.createElement("div");
            commentDiv.classList.add("comment");
            commentDiv.textContent = commentText;
            return commentDiv;
        }

        function saveComment(postId) {
            const commentInput = document.getElementById(`commentInput-${postId}`);
            const commentText = commentInput?.value.trim();
            if (!commentText) return;

            const posts = JSON.parse(localStorage.getItem("communityPosts")) || [];
            const postIndex = posts.findIndex(post => post.id === postId);

            if (postIndex !== -1) {
                posts[postIndex].comments.push(commentText);
                localStorage.setItem("communityPosts", JSON.stringify(posts));

                const commentSection = document.getElementById(`comments-${postId}`);
                if (commentSection) {
                    commentSection.appendChild(createCommentElement(commentText));
                }

                commentInput.value = "";
            }
        }

        function savePosts() {
            const posts = [];
            postsContainer.querySelectorAll(".post").forEach(postDiv => {
                const postText = postDiv.querySelector("p")?.textContent || "";
                const postId = parseInt(postDiv.querySelector(".comment-btn")?.dataset.postId || "0");
                const comments = Array.from(postDiv.querySelectorAll(".comment"), c => c.textContent);
                posts.push({ id: postId, text: postText, comments });
            });
            localStorage.setItem("communityPosts", JSON.stringify(posts));
        }

        function loadPosts() {
            const posts = JSON.parse(localStorage.getItem("communityPosts")) || [];
            postsContainer.innerHTML = "";
            posts.forEach(post => {
                postsContainer.appendChild(createPostElement(post.id, post.text, post.comments));
            });
        }
    }

    // === Chat Section ===
    function initChat() {
        const apiKey = "AIzaSyDcYtRhFRat81-Qj5hhBLB_zU_5jsikcvs";

        const userInput = document.getElementById("userInput");
        const chatBox = document.getElementById("chatBox");
        const chatPopup = document.getElementById("chatPopup");

        window.toggleChatPopup = () => {
            if (chatPopup) {
                chatPopup.style.display = chatPopup.style.display === "flex" ? "none" : "flex";
            }
        };

        window.sendMessage = async () => {
            const input = userInput?.value.trim();
            if (!input) return;

            appendMessage("user", input);
            userInput.value = "";

            const systemInstruction = `
                [Your Guardian Angel system prompt, unchanged...]
            `;

            const fallbackResponse = `I’m here with you, and I hear you. It sounds like ${
                input.toLowerCase().includes("feel")
                    ? "you’re carrying some heavy feelings"
                    : "something’s on your mind"
            }—would you like to share more? I’ll listen with all my heart.`;

            try {
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: systemInstruction }, { text: input }] }],
                            generationConfig: {
                                temperature: 0.9,
                                topP: 0.95,
                                maxOutputTokens: 1024,
                            },
                        }),
                    }
                );

                if (!response.ok) throw new Error(await response.text());

                const data = await response.json();
                const angelResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;

                if (angelResponse) {
                    appendMessage("angel", angelResponse);
                } else {
                    throw new Error("Invalid response format");
                }
            } catch (err) {
                console.error("Chat error:", err.message);
                appendMessage("angel", fallbackResponse);
            }
        };

        function appendMessage(sender, text) {
            if (!chatBox) return;
            const msg = document.createElement("div");
            msg.className = `message ${sender}`;
            msg.textContent = text;
            chatBox.appendChild(msg);
            chatBox.scrollTop = chatBox.scrollHeight;
        }

        userInput?.addEventListener("keypress", e => {
            if (e.key === "Enter") window.sendMessage();
        });
    }
});
