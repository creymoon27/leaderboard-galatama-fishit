exports.handler = async function (event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const rawUsn = (event.queryStringParameters && event.queryStringParameters.username) || "";
    const usn = String(rawUsn).replace(/^@/, "").trim();

    if (!usn) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ status: "empty", message: "Username kosong" })
      };
    }

    const userRes = await fetch("https://users.roblox.com/v1/usernames/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        usernames: [usn],
        excludeBlocking: false
      })
    });

    if (!userRes.ok) {
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ status: "error", message: `Roblox user API status ${userRes.status}` })
      };
    }

    const userJson = await userRes.json();
    const u = userJson && Array.isArray(userJson.data) ? userJson.data[0] : null;

    if (!u || !u.id) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ status: "not_found", message: "Username tidak ditemukan di Roblox" })
      };
    }

    let avatarUrl = "";
    let fullBodyUrl = "";

    try {
      const headRes = await fetch(
        `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${u.id}&size=150x150&format=Png&isCircular=false`
      );
      if (headRes.ok) {
        const headJson = await headRes.json();
        avatarUrl = (headJson && headJson.data && headJson.data[0] && headJson.data[0].imageUrl) || "";
      }

      const bodyRes = await fetch(
        `https://thumbnails.roblox.com/v1/users/avatar?userIds=${u.id}&size=352x352&format=Png&isCircular=false`
      );
      if (bodyRes.ok) {
        const bodyJson = await bodyRes.json();
        fullBodyUrl = (bodyJson && bodyJson.data && bodyJson.data[0] && bodyJson.data[0].imageUrl) || avatarUrl;
      }
    } catch (_) {}

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: "ok",
        userId: u.id,
        username: u.name,
        displayName: u.displayName || u.name,
        avatarUrl,
        fullBodyUrl
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ status: "error", message: err.message || "Internal error" })
    };
  }
};