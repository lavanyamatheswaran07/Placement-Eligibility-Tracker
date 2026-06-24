<script>
    let name = $state("");
    let message = $state("");
    let success = $state(false);

    const handleSubmit = async (event) => {
        event.preventDefault();

        const response = await fetch("/api/postStudentDetails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ name }),
        });

        const result = await response.json();

        success = result.success;
        message = result.message;
    };
</script>

<div class="flex flex-col items-center justify-center">
    <form onsubmit={handleSubmit} class="flex flex-col">
        <input
            bind:value={name}
            class="border border-gray-300 rounded-lg p-2"
            placeholder="Enter your name"
        />

        <button type="submit">
            Submit
        </button>
    </form>

    {#if message}
        <p>{message}</p>
    {/if}
</div>