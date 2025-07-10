// Chart configuration and functionality

// Create a rainbow color palette based on number of senders
function generateColors(count) {
    const colors = [];
    for (let i = 0; i < count; i++) {
        const hue = (i * 360 / count) % 360;
        colors.push(`hsl(${hue}, 70%, 60%)`);
    }
    return colors;
}

// Generate data for the chart (equal distribution since we don't have per-user message counts)
function createDummyData(length) {
    return Array(length).fill(100);
}

function initializePieChart() {

    // Get data from the global variable set in HTML
    const senderLabels = 6;

    // Pie chart for sender distribution
    const ctx = document.getElementById('senderChart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: senderLabels,
            datasets: [{
                data: createDummyData(senderLabels.length),
                backgroundColor: generateColors(senderLabels.length),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                }
            }
        }
    });

}

document.addEventListener('DOMContentLoaded', initializePieChart);