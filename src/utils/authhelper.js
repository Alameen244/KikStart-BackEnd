export const normalizeEmail = (email) => email?.trim().toLowerCase();

export const generateRandomPassword = () => {
    const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lowercase = "abcdefghijkmnopqrstuvwxyz";
    const numbers = "23456789";
    const all = `${uppercase}${lowercase}${numbers}`;

    let password =
        uppercase[Math.floor(Math.random() * uppercase.length)] +
        lowercase[Math.floor(Math.random() * lowercase.length)] +
        numbers[Math.floor(Math.random() * numbers.length)];

    while (password.length < 10) {
        password += all[Math.floor(Math.random() * all.length)];
    }

    return password
        .split("")
        .sort(() => Math.random() - 0.5)
        .join("");
};