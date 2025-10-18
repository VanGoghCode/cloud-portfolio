"use client";

import { useEffect, useRef } from "react";

/**
 * TypewriterBackground Component
 * Creates a terminal-like typewriter animation in the background
 */

const codeSnippets = [
  "# Multi-Cloud Terraform Configuration",
  "terraform {",
  "  required_providers {",
  "    aws    = { source = \"hashicorp/aws\", version = \"~> 5.0\" }",
  "    google = { source = \"hashicorp/google\", version = \"~> 5.0\" }",
  "    azurerm = { source = \"hashicorp/azurerm\", version = \"~> 3.0\" }",
  "  }",
  "}",
  "",
  "# AWS Provider Configuration",
  "provider \"aws\" {",
  "  region = \"us-east-1\"",
  "  access_key = var.aws_access_key",
  "  secret_key = var.aws_secret_key",
  "}",
  "",
  "# Google Cloud Provider",
  "provider \"google\" {",
  "  project = var.gcp_project_id",
  "  region  = \"us-central1\"",
  "  credentials = file(var.gcp_credentials_file)",
  "}",
  "",
  "# Azure Provider Configuration",
  "provider \"azurerm\" {",
  "  features {}",
  "  subscription_id = var.azure_subscription_id",
  "  tenant_id       = var.azure_tenant_id",
  "}",
  "",
  "# AWS VPC and Networking",
  "resource \"aws_vpc\" \"main\" {",
  "  cidr_block           = \"10.0.0.0/16\"",
  "  enable_dns_hostnames = true",
  "  tags = { Name = \"multi-cloud-vpc\" }",
  "}",
  "",
  "resource \"aws_subnet\" \"public\" {",
  "  vpc_id            = aws_vpc.main.id",
  "  cidr_block        = \"10.0.1.0/24\"",
  "  availability_zone = \"us-east-1a\"",
  "}",
  "",
  "# AWS EC2 Instance",
  "resource \"aws_instance\" \"web_server\" {",
  "  ami           = \"ami-0c55b159cbfafe1f0\"",
  "  instance_type = \"t3.micro\"",
  "  subnet_id     = aws_subnet.public.id",
  "  tags = { Name = \"AWS-Web-Server\" }",
  "}",
  "",
  "# Google Cloud VPC Network",
  "resource \"google_compute_network\" \"vpc_network\" {",
  "  name                    = \"gcp-vpc-network\"",
  "  auto_create_subnetworks = false",
  "}",
  "",
  "resource \"google_compute_subnetwork\" \"subnet\" {",
  "  name          = \"gcp-subnet\"",
  "  ip_cidr_range = \"10.1.0.0/24\"",
  "  region        = \"us-central1\"",
  "  network       = google_compute_network.vpc_network.id",
  "}",
  "",
  "# Google Cloud Compute Instance",
  "resource \"google_compute_instance\" \"vm_instance\" {",
  "  name         = \"gcp-vm-instance\"",
  "  machine_type = \"e2-micro\"",
  "  zone         = \"us-central1-a\"",
  "  boot_disk {",
  "    initialize_params {",
  "      image = \"debian-cloud/debian-11\"",
  "    }",
  "  }",
  "  network_interface {",
  "    subnetwork = google_compute_subnetwork.subnet.id",
  "  }",
  "}",
  "",
  "# Azure Resource Group",
  "resource \"azurerm_resource_group\" \"main\" {",
  "  name     = \"multi-cloud-resources\"",
  "  location = \"East US\"",
  "}",
  "",
  "# Azure Virtual Network",
  "resource \"azurerm_virtual_network\" \"vnet\" {",
  "  name                = \"azure-vnet\"",
  "  address_space       = [\"10.2.0.0/16\"]",
  "  location            = azurerm_resource_group.main.location",
  "  resource_group_name = azurerm_resource_group.main.name",
  "}",
  "",
  "resource \"azurerm_subnet\" \"subnet\" {",
  "  name                 = \"azure-subnet\"",
  "  resource_group_name  = azurerm_resource_group.main.name",
  "  virtual_network_name = azurerm_virtual_network.vnet.name",
  "  address_prefixes     = [\"10.2.1.0/24\"]",
  "}",
  "",
  "# Azure Virtual Machine",
  "resource \"azurerm_linux_virtual_machine\" \"vm\" {",
  "  name                = \"azure-vm\"",
  "  resource_group_name = azurerm_resource_group.main.name",
  "  location            = azurerm_resource_group.main.location",
  "  size                = \"Standard_B1s\"",
  "  admin_username      = \"azureuser\"",
  "  network_interface_ids = [azurerm_network_interface.nic.id]",
  "  os_disk {",
  "    caching              = \"ReadWrite\"",
  "    storage_account_type = \"Standard_LRS\"",
  "  }",
  "  source_image_reference {",
  "    publisher = \"Canonical\"",
  "    offer     = \"UbuntuServer\"",
  "    sku       = \"18.04-LTS\"",
  "    version   = \"latest\"",
  "  }",
  "}",
  "",
  "# VPN Gateway for AWS-GCP Connection",
  "resource \"aws_vpn_gateway\" \"vpn_gw\" {",
  "  vpc_id = aws_vpc.main.id",
  "  tags   = { Name = \"aws-gcp-vpn\" }",
  "}",
  "",
  "# Output values",
  "output \"aws_instance_ip\" {",
  "  value = aws_instance.web_server.public_ip",
  "}",
  "",
  "output \"gcp_instance_ip\" {",
  "  value = google_compute_instance.vm_instance.network_interface[0].access_config[0].nat_ip",
  "}",
  "",
  "output \"azure_vm_id\" {",
  "  value = azurerm_linux_virtual_machine.vm.id",
  "}",
];

export default function TypewriterBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setCanvasSize();
    window.addEventListener("resize", setCanvasSize);

    // Typewriter lines
    class TypewriterLine {
      text: string;
      x: number;
      y: number;
      currentIndex: number;
      speed: number;
      color: string;
      opacity: number;
      isComplete: boolean;
      isTyping: boolean;

      constructor(y: number, shouldStartTyping = false) {
        this.text = codeSnippets[Math.floor(Math.random() * codeSnippets.length)];
        this.x = 10;
        this.y = y;
        this.currentIndex = 0;
        this.speed = 30; // Fixed speed for consistent typing
        this.color = `rgba(0, 0, 0, ${Math.random() * 0.2 + 0.4})`;
        this.opacity = Math.random() * 0.2 + 0.5;
        this.isComplete = false;
        this.isTyping = shouldStartTyping;
      }

      startTyping() {
        this.isTyping = true;
      }

      update() {
        if (this.isTyping && this.currentIndex < this.text.length) {
          this.currentIndex += this.speed / 60; // Smooth typing
        } else if (this.currentIndex >= this.text.length) {
          this.isComplete = true;
        }
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.font = "18px 'Courier New', monospace";
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.opacity;
        
        const visibleText = this.text.substring(0, Math.floor(this.currentIndex));
        ctx.fillText(visibleText, this.x, this.y);
        
        // Blinking cursor effect - only on the line currently typing
        if (this.isTyping && !this.isComplete && Math.floor(Date.now() / 500) % 2 === 0) {
          ctx.fillStyle = `rgba(0, 0, 0, ${this.opacity})`;
          ctx.fillRect(
            this.x + ctx.measureText(visibleText).width + 2,
            this.y - 16,
            3,
            18
          );
        }
        
        ctx.globalAlpha = 1;
      }
    }

    // Create initial lines
    const lines: TypewriterLine[] = [];
    const lineHeight = 35;
    const maxLines = Math.floor(canvas.height / lineHeight);

    // Create all lines but only start typing the first one
    for (let i = 0; i < maxLines; i++) {
      lines.push(new TypewriterLine(i * lineHeight + 40, i === 0));
    }

    let currentTypingLine = 0;

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw all lines
      lines.forEach((line) => {
        line.update();
        line.draw(ctx);
      });

      // Check if current line is complete and start next line
      if (currentTypingLine < lines.length && lines[currentTypingLine]?.isComplete) {
        currentTypingLine++;
        if (currentTypingLine < lines.length) {
          lines[currentTypingLine].startTyping();
        } else {
          // All lines are complete, restart from the beginning
          currentTypingLine = 0;
          lines.forEach((line, index) => {
            line.text = codeSnippets[Math.floor(Math.random() * codeSnippets.length)];
            line.currentIndex = 0;
            line.isComplete = false;
            line.isTyping = index === 0;
            line.color = `rgba(0, 0, 0, ${Math.random() * 0.2 + 0.4})`;
            line.opacity = Math.random() * 0.2 + 0.5;
          });
        }
      }

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", setCanvasSize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none mx-[10vw]"
      style={{
        zIndex: -1,
        opacity: 0.5,
      }}
      aria-hidden="true"
    />
  );
}
