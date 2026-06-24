<p>this is a login page</p>
<script>
    let regNo = "";
    let cgpa = "";
    let message = "";

    function checkEligibility() {
        if (cgpa >= 7.0) {
            message = "✅ Eligible for Placements";
        } else {
            message = "❌ Not Eligible for Placements (Minimum CGPA: 7.0)";
        }
    }
</script>

<div class="container">
    <div class="login-box">
        <h1>Placement Eligibility Portal</h1>

        <label>Register Number</label>
        <input
            type="text"
            bind:value={regNo}
            placeholder="Enter Register Number"
        />

        <label>CGPA</label>
        <input
            type="number"
            step="0.01"
            bind:value={cgpa}
            placeholder="Enter CGPA"
        />

        <button on:click={checkEligibility}>
            Check Eligibility
        </button>

        {#if message}
            <p class="result">{message}</p>
        {/if}
    </div>
</div>

<style>
    .container {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        background: #f4f4f4;
    }

    .login-box {
        background: white;
        padding: 30px;
        border-radius: 10px;
        width: 350px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.2);
    }

    h1 {
        text-align: center;
        color: #333;
        margin-bottom: 20px;
    }

    label {
        display: block;
        margin-top: 10px;
        font-weight: bold;
    }

    input {
        width: 100%;
        padding: 10px;
        margin-top: 5px;
        border: 1px solid #ccc;
        border-radius: 5px;
    }

    button {
        width: 100%;
        padding: 10px;
        margin-top: 20px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
    }

    button:hover {
        background: #0056b3;
    }

    .result {
        margin-top: 15px;
        text-align: center;
        font-weight: bold;
    }
</style>