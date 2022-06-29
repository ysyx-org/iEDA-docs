---
author: 黄增荣，郭澄霖
audition: iEDA 课题组
history:
  - version: 0.11
    date: 2022-05-23
    author: Yell
    description: 更新部分示意图，调整格式
  - version: 0.10
    date: 2022-05-09
    author: 郭澄霖
    description: iEDA-FP 说明书初始版本
---

# iFP - 布局

## 1. 简介

> *简要描述设计的背景、编写目的、目标读者等；*

在数字集成电路物理设计过程中，Floorplan是设计的最初始阶段，iFP是针对该阶段设计的，主要功能：一、实现版图的初始化，包括设定die、core、row、site以及预先摆放tapcell、macro等单元；二、根据网表自动摆放IO；三、根据网表结构和IO位置自动化摆放macro；四、电源网络生成等功能。

### 1.1 设计需求和目标

> *描述需求和目标。*

* **完成版图的初始化：** 确定die的面积，根据core的面积生成row的信息
* **IO单元的摆放：** 完成IO单元的放置，同时保证其摆放符合相应的设计规则；以及IO填充单元的摆放
* **宏单元的摆放**：对标准单元进行**划分**，划分结果的每部分看成一个**fake-macro**，再使用启发式算法对真实**macro**和**fake-macro**的混合摆放
* **物理单元的摆放**：完成tapcell、endcap的摆放
* **电源网络相关设计**：完成创建电源网络、电源网络的布线、外围IO单元连接至电源网络的布线

### 1.2 专有名词

| **名词（缩写）** | **详细定义** |
| ---------------------- | ------------------ |
| **xxx**          | English  中文      |
|                        |                    |
|                        |                    |
|                        |                    |

### 1.3 参考文档

### 1.4 使用说明

> *每一个模块*  */*  *核心类*  */* *子程序的功能，需要的参数，截屏*

#### 1.4.1 init_floorplan

初始化整个设计，设置die的面积，生成row、track等基本信息

- -die_area   die的面积，一个字符串，以空格区分每个值，此处的值为没有乘DBU的
- -core_area   core的面积，一个字符串，以空格区分每个值，此处的值为没有乘DBU的
- -core_site  core的site选取
- -io_site  针对110工艺，此处为**可选参数**，会默认选择“IOSite“

#### 示例：

```tcl
set DIE_AREA "0.0    0.0   2843    2843“
set CORE_AREA "150 150 2693 2693"
set PLACE_SITE HD_CoreSite
set IO_SITE IOSite

init_floorplan \
	-die_area $DIE_AREA \
	-core_area $CORE_AREA \
	-core_site $PLACE_SITE \
	-io_site $IO_SITE
```

### 1.4.2 placeInst

已测试的功能包括：

1. 摆放IOCELL
2. 摆放电源CELL
3. 摆放IOFILLER
4. 摆放CORNER

在摆放以上四种时，会进行摆放检查，规则是是否按照IOSite摆放以及是否在DIE BOUNDARY上

5.摆放标准单元

- -inst_name  instance的名字
- -llx  左下角横坐标，此时的数值是绝对坐标，即需设置乘过DBU的值
- -lly  左下角纵坐标
- -orient  朝向，可使用（N，S，W，E）或（R0，R180，R90，R270）
- -cellmaster  cell的种类

#### 示例：

```tcl
placeInst \
   -inst_name u0_clk \
   -llx  0 \
   -lly 2510940 \
   -orient E \
   -cellmaster PX1W
```

### 1.4.3 placePort

该命令只针对与IOCELL连接的IOPIN的port生成，电源CELL的port不使用该接口

- -pin_name   iopin名字
- -offset_x 相对于所连接的IOCELL的左下角坐标的偏移量，此处需设置绝对长度，即乘过DBU之后的值
- -offset_y 相对于所连接的IOCELL的左下角坐标的偏移量，此处需设置绝对长度，即乘过DBU之后的值
- -width 矩形宽度，相对于所连接的IOCELL的左下角坐标的偏移量，此处需设置绝对长度，即乘过DBU之后的值
- -height 矩形高度，相对于所连接的IOCELL的左下角坐标的偏移量，此处需设置绝对长度，即乘过DBU之后的值
- -layer 所在的层的名字

#### 示例：

```tcl
placePort \
    -pin_name osc_in_pad \
    -offset_x 9000 \
    -offset_y 71500 \
    -width 58000 \
    -height 58000 \
    -layer ALPA
```

### 1.4.4 placeIoFiller

摆放IOFiller，支持四个边自动填充

必选参数：-filler_types  IOFiller的种类

可选参数：

- -prefix 生成的filler的名字的前缀，默认为IOFill
- -edge  设定在哪一个边填充，不设置则为全局填充
- -begin_pos  设定在某边某一个线段内进行填充，如果不设置，则默认该边全部填充
- -end_pos  此处begin与pos的值为double，为没有乘DBU之前的值，与init类似

#### 示例：

```tcl
placeIoFiller \
    -filler_types "PFILL50W PFILL20W PFILL10W PFILL5W PFILL2W PFILL01W PFILL001W"
#-prefix
#-edge
#-begin_pos
#-end_pos
```

### 1.4.5 tapcell

放置tapcell以及endcap

- -tapcell 设置tapcell的种类
- -distance 32.5 设置tapcell的间距，此处为没有乘DBU的值
- -endcap endcap的种类

### 示例：

```tcl
tapcell \
    -tapcell LVT_FILLTIEHD \
    -distance 32.5 \
    -endcap LVT_F_FILLHD1
```

### 1.4.6 global_net_connect

创建电源net

- -net_name 电源网络名称
- -instance_pin_name  instance连接该网络的pin的名称。当前还不支持指定某些instance的该pin连接到该电源网络，默认为全局含有该pin的instance都连接到该网络
- -is_power  需设置为1或0： 1代表use power，0代表use ground

#### 示例：

```tcl
global_net_connect \
    -net_name VDD \
    -instance_pin_name VDD \
    -is_power 1

global_net_connect \
    -net_name VDD \
    -instance_pin_name VDDIO \
    -is_power 1

global_net_connect \
    -net_name VSS \
    -instance_pin_name VSS \
    -is_power 0
```

### 1.4.7 add_powernet_io

为电源NET添加IOPIN

- -net_name	电源网络名称
- -direction   参数（INPUT、OUTPUT、INOUT、FEEDTHRU、OUTTRI），pin的数据direction
- -pin_name 可选参数，默认为电源网络名称

### 示例：

```tcl
add_powernet_io \
    -net_name VDD \
    -direction INOUT 

	#-pin_name VDD
```

### 1.4.8 placePdnPort

为电源网络的IOPIN添加PORT

- -pin_name  iopin名字
- -io_cell_name io io cell的名字
- -offset_x  相对io cell的port矩形的左下角坐标
- -offset_y  相对io cell的port矩形的左下角坐标
- -width  矩形宽度
- -height 矩形高度
- -layer  port所属绕线层

### 示例：

```tcl
placePdnPort \
    -pin_name VDD \
    -io_cell_name xxx\
    -offset_x 10 \
    -offset_y 10 \
    -width 100 \
    -height 100 \
    -layer ALPA

placePdnPort \
    -pin_name VDD \
    -io_cell_name xxx\
    -offset_x 20 \
    -offset_y 20 \
    -width 200 \
    -height 200 \
    -layer ALPA  
#这两个命令可以为VDD pin添加两个port
```

### 1.4.9 stdcell_rail_grid

生成标准单元供电线，会生成绕线信息

- -layer_name 生成电源网格的层
- -net_name_power power net name
- -net_name_ground ground net name
- -width 线宽。是没有乘DBU的数值
- -offset 相对于core边界的偏移量，建议设置为0，仅测试过偏移为0的情况。是没有乘DBU的数值

### 示例：

```tcl
stdcell_rail_grid \
    -layer_name "METAL1" \
    -net_name_power VDD \
    -net_name_ground VSS \
    -width 0.24 \
    -offset 0
```

### 1.4.10 stdcell_stripe_grid

生成标准单元条形电源线

- -layer_name  生成电源线的层
- -net_name_power  power net name
- -net_name_ground  ground net name
- -width 线宽。是没有乘DBU的数值
- -pitch  同类型电源线的间距。对于标准单元来说，同层的power线与ground线间距为0.5*pitch
- -offset 相对于core边界的偏移量。是没有乘DBU的数值

### 示例：

```tcl
stdcell_stripe_grid \
   -layer_name "METAL5" \
   -net_name_power VDD \
   -net_name_ground VSS \
   -width 1.64 \
   -pitch 13.12 \
   -offset 3.895
```

### 1.4.11 connect_two_layer

连接指定的两层的电源线

- -layers ：可以一对一对的输入，也可以将全部需要连接的层信息一起输入

### 示例：

```tcl
set connect1 "METAL1 METAL4" \
set connect2 "METAL4 METAL5" \
set connect3 "METAL5 METAL6" \
set connect4 "METAL6 METAL7" \
set connect5 "METAL7 METAL8" \
set connect6 "METAL8 ALPA" \
connect_two_layer \
    -layers [concat $connect1 $connect2 $connect3 $connect4 $connect5 $connect6]
```

```tcl
[1]
connect_two_layer \
   	 -layers [concat  \$connect1 $connect2]

[2]
connect_two_layer \
    -layers "METAL1 METAL4"
connect_two_layer \
    -layers "METAL4 METAL5"
```

**序号1，2的效果是一样的**

**PS：被连接的两层需要含有电源线**

### 1.4.12 connectIoPinToPower

将电源NET的IOPIN的Port连接至Core内电源线。(会对Port的坐标进行检查)

- -point_list 连接关系所经过的拐角处的坐标点（起点和终点的坐标也需要有），也可以只输入起点和终点坐标
- -layer 想要进行连线的层

### 示例：

```tcl
connectIoPinToPower \
    -point_list "998 2802 915 2598" \
    -layer METAL1
```

### 1.4.13 connectPowerStripe

- -point_list 连接关系所经过的拐角处的坐标点（起点和终点的坐标也需要有）
- -net_name 想要连接到的电源网络的名称
- -layer 想要进行连线的层
- -width 可选项，指定连接线的宽度;如果不设置则默认设为被连接的电源线的线宽

### 示例：

```tcl
connectPowerStripe \
    -point_list "2675.606 1998.707 2680.606 1998.707 2680.606 1892.165 2803.686 1892.165" \
    -net_name VDD \
    -layer ALPA \
    -width 1000
```

### 1.4.14 read_lef

读入lef文件，以字符串列表的形式读入

### 示例：

```tcl
read_lef "../../Designs/scc011u_8lm_1tm_thin_ALPA/scc011u_8lm_1tm_thin_ALPA.lef \
          ../../Designs/scc011u_8lm_1tm_thin_ALPA/scc011ums_hd_lvt.lef \
          ../../Designs/scc011u_8lm_1tm_thin_ALPA/S013PLLFN_8m_V1_2_1.lef \
          ../../Designs/scc011u_8lm_1tm_thin_ALPA/SP013D3WP_V1p7_8MT.lef \
          ../../Designs/scc011u_8lm_1tm_thin_ALPA/S011HD1P256X32M2B0.lef \
          ../../Designs/scc011u_8lm_1tm_thin_ALPA/S011HD1P512X58M2B0.lef \
          ../../Designs/scc011u_8lm_1tm_thin_ALPA/S011HD1P1024X64M4B0.lef \
          ../../Designs/scc011u_8lm_1tm_thin_ALPA/S011HD1P256X8M4B0.lef \
          ../../Designs/scc011u_8lm_1tm_thin_ALPA/S011HD1P512X73M2B0.lef \
          ../../Designs/scc011u_8lm_1tm_thin_ALPA/S011HD1P128X21M2B0.lef \
          ../../Designs/scc011u_8lm_1tm_thin_ALPA/S011HD1P512X19M4B0.lef \
          ../../Designs/scc011u_8lm_1tm_thin_ALPA/S011HDSP4096X64M8B0.lef "
```

### 1.4.15 read_def

读入def文件，以字符串的形式读入

### 示例：

```tcl
read_def "/home/guochenglin/Designs/iFLOW/asic_top.v2def.openroad_1.1.0.HD.MAX.1015_50M/asic_top.def"
```

### 1.4.16 write_def

写出def文件。参数为写出的文件路径。

### 示例：

```tcl
write_def "iEDA_FP.def"
```

### 1.4.17 connectMacroPdn

将macro的电源引脚连接至电源网络

- -pin_layer  macro电源pin所在的层
- -pdn_layer  电源网络所在的层
- -power_pins  power引脚的名字
- -ground_pins  ground引脚的名字
- -orient 满足该满足方向的macro都会进行电源连接的操作

### **示例：**

```tcl
connectMacroPdn -pin_layer "METAL4" -pdn_layer "METAL7" -power_pins "VDD" -ground_pins "VSS" -orient "R0 R180 MX MY"
```

### 1.4.18 addPlacementBlk

添加布局障碍

- -box   矩形障碍的形状

### 示例：

```tcl
addPlacementBlk -box "159000 2200000 880000 3760010"
```

### 1.4.19 addPlacementHalo

以instance实例为障碍中心，生成布局障碍

- -inst_name  instance的名字；如果设置为all，则是对所有摆放好的macro生效
- -distance  四个数值分别代表矩形的左、下、右、上的扩展宽度

### 示例：

```tcl
addPlacementHalo -inst_name u0_soc_top/u0_vga_ctrl/vga/buffer11 -distance "5000 5000 5000 5000"
```

### 1.4.20 addRoutingBlk

添加布线障碍

- -pgnetonly  是否只对电源线生效
- -layer  障碍生效的绕线层
- -box   障碍的形状，四个数字为llx，lly，urx，ury

### 示例：

```tcl
addRoutingBlk \
-pgnetonly 1 \
-layer "METAL1 METAL2 METAL3 METAL4 METAl5 METAl6 METAL7 METAL8 ALPA" \ 
-box "150000 2200000 880000 3778880"
```

### 1.4.21 addRoutingHalo

以instance实例为障碍中心，生成绕线障碍

- -pgnetonly  是否只对电源线生效;**设置为1代表只针对电源线**
- -layer  障碍生效的绕线层
- -inst_name  指定的instance的名字；**如果设置为all，则对所有摆放好的macro生效**
- -distance  障碍的形状，四个数值分别代表矩形的左、下、右、上的扩展宽度

### 示例：

```tcl
addRoutingHalo \
-pgnetonly 1 \
-inst_name u0_soc_top/u0_ysyx_210539/icache/Ram_bw_3/ram \
-layer "METAL1 METAL2 METAL3 METAL4 METAL5 METAL6" \
-distance "6000 6000 6000 6000"
```

## 2. 整体设计

### 2.1 总体架构

iFP总体架构如下图所示，其中：

![图片.png](https://images.gitee.com/uploads/images/2022/0520/110346_36cc7d96_1737075.png)

* **InitFloorplan** ：提供版图初始化功能，如设置设计面积、生成track、row信息等。
* **IOPlacer（摆放单元相关）** ：提供摆放单元实例、摆放port、增加布局布线障碍等功能。
* **Pdn（电源相关）** ：提供电源网络的创建、电源网络的IO Pin的摆放以及电源网络的布线。
* **Tapcell（物理单元相关）** ：提供物理单元的摆放，如tapcell、endcap。
* **MacroPlacer（宏单元的摆放）** ：。

### 2.2 软件流程

> 描述软件的总体处理流程，**用文字描述清楚整个运行过程，并附上相应的代码**
> ![图片.png](https://images.gitee.com/uploads/images/2022/0520/110424_09ce32be_1737075.png)

软件运行有三种方式：

（1）运行可执行程序后，单步执行tcl命令

（2）在可执行程序后，添加tcl脚本路径参数，执行脚本中的内容
![图片.png](https://images.gitee.com/uploads/images/2022/0520/110529_aa1f7e28_1737075.png)

（3）在可执行程序后，添加json脚本路径参数，执行脚本中的内容
![图片.png](https://images.gitee.com/uploads/images/2022/0520/110604_66ffc62f_1737075.png)

**TCL指令控制**

```c++
int main(int argc, char **argv) {
  /**
   * @brief Determine the format of the read-in configuration file
   */
  if (argc == 2) {
    std::string file = argv[1];
      /// control by tcl
    if (file.substr(file.size() - 4) == ".tcl") {
      std::cout << "Read tcl config file: " << argv[1] << endl;
      auto shell = pcl::UserShell::getShell();
      shell->set_init_func(add);
      shell->userMain(argv[1]);
    } /// control by json
      else if (file.substr(file.size() - 5) == ".json") {
      std::cout << "Read json config file: " << argv[1] << endl;
      //  rt_config
      std::string fp_config_file_path = argv[1];
      pcl::Stats stats;

      PCL::iDB::IdbBuilder *idb_builder = nullptr;

      // ifp::iFP *fp_flow = new ifp::iFP(fp_config_file_path, idb_builder);
      // fp_flow->runStandardFP();
      // delete fp_flow;

      std::cout << "[FP Info] Memory usage : " << stats.memoryDelta() << "MB"
                << std::endl;
      std::cout << "[FP Info] Elapsed time : " << stats.elapsedRunTime() << "s"
                << std::endl;
    }
  } else {
      /// control by cmd
    std::cout << "[FP Info] No input .tcl or .json config file path!"
              << std::endl;
    std::cout << "[FP Info] Use cmd control!" << std::endl;
    auto shell = pcl::UserShell::getShell();
    shell->set_init_func(add);
    shell->userMain(argv[1]);
  }
  return 0;
}
```

#### 2.2.1 InitFloorplan

![图片.png](https://images.gitee.com/uploads/images/2022/0520/110719_65738f43_1737075.png)

row的信息是根据设置的core面积以及设置的site类型共同决定的，位置、长度既满足最小制造尺寸（manufacturegrid），也满足site的整数倍；不存在site仅有部分表现在设计图，所有的site都要是完整尺寸。

track的信息是根据lef文件中有关Routing Layer的信息，来生成的。

#### 2.2.2 IOPlacer

![图片.png](https://images.gitee.com/uploads/images/2022/0520/110748_765949d0_1737075.png)

IO单元的摆放规则：一端需要贴合die边界。

IO填充单元的摆放规则：一端需要贴合die边界。

IO Pin的摆放规则：现在还没有设置。

#### 2.2.3 MacroPlacer

#### 2.2.4 Pdn

![图片.png](https://images.gitee.com/uploads/images/2022/0520/110827_8bf6ae3e_1737075.png)

电源网络布线分为两部分：

- 在METAL1，为标准单元供电，所以布线时是根据Row、Track信息进行布线
- 在高层金属上生成金属网络时，不需要考虑Row的信息了
- 同一个电源网络在不同层会有布线，需要通过通孔将其连接

Macro单元供电：

- 本质上是将Macro的电源引脚连接至电源网络
- 目前110nm使用的工艺中，Macro的电源引脚都在Metal4层。

#### 2.2.5 Tapcell

![图片.png](https://images.gitee.com/uploads/images/2022/0520/110922_2a5a82b9_1737075.png)

endcap是摆放在core左右两端的物理单元

tapcell是摆放在core中间的物理单元

### 2.3 子模块设计

> *描述软件的各个组成子模块的设计，独立完成功能，相互依赖关系等。这些模块的情况*

![图片.png](https://images.gitee.com/uploads/images/2022/0520/111049_5f9c3e5b_1737075.png)

* **InitFloorplan:**
  
  * 读取设计文件、工艺文件
  * 设计die面积、生成row、track信息
* **IOPlacer：**
  
  * 摆放IO单元
  * 摆放IO填充单元
  * 摆放布局障碍、绕线障碍
  * 摆放IO port
* **MacroPlacer**
  
  - 根据网表结构对标准单元进行划分
  - 划分后的每部分看成一个fake-macro，重新构建netlist
  - 利用启发式算法，将macro与fake-macro混合布局
  - fake-macro的最终坐标作为该部分标准单元的初始解
* **PhysicalCell placer**
  
  * 摆放tapcell
  * 摆放endcap
* **Pdn**
  
  * 摆放电源IO port
  * 生成全局电源网络
  * 电源网络布线
  * 边缘IO连接至电源网络的布线

### 2.4 评价指标

### 2.5 算法设计

> *描述软件用到的主要算法，可以用伪代码的形式描述。*

### 2.6 数据结构设计

> *描述用到的主要数据结构，包括类的设计，继承关系等等。*

## 3. 接口设计

### 3.1 外部接口

> *包括用户界面、软件接口。*

```c++
FpInterface *_fp_interface;
```

（1）初始化FP

```c++
void initFloorplan(const double &die_lx, const double &die_ly,
                     const double &die_ux, const double &die_uy,
                     const double &core_lx, const double &core_ly,
                     const double &core_ux, const double &core_uy,
                     const std::string &core_site_name,
                     const std::string &iocell_site_name);
```

（2）摆放单元

```c++
void placeInst(std::string instance_name, int32_t llx, int32_t lly,
                 std::string orient, std::string cellmaster,
                 std::string source_str = "");
```

（3）添加布局障碍

```c++
void addPlacementBlockage(int32_t llx, int32_t lly, int32_t urx, int32_t ury);
```

| 参数 | 含义         |
| ---- | ------------ |
| llx  | 左下角横坐标 |
| lly  | 左下角纵坐标 |
| urx  | 右上角横坐标 |
| ury  | 右上角纵坐标 |

（4）以Instance的位置为中心，放置布局障碍

```c++
void FpInterface::addPlacementHalo(const std::string &inst_name, int32_t top,
                                   int32_t bottom, int32_t left,
                                   int32_t right);
```

| 参数      | 含义                   |
| --------- | ---------------------- |
| inst_name | 被选中的Instance的名字 |
| top       | 顶端扩展距离           |
| bottom    | 低端扩展距离           |
| left      | 左端扩展距离           |
| right     | 右端扩展距离           |

（5）添加布线障碍

```c++
void addRoutingBlockage(int32_t llx, int32_t lly, int32_t urx, int32_t ury,
                          const std::vector<std::string> &layers,
                          const bool &is_except_pgnet = false);
```

| 参数            | 含义             |
| --------------- | ---------------- |
| llx             | 障碍左下角横坐标 |
| lly             | 障碍左下角纵坐标 |
| urx             | 障碍右上角横坐标 |
| ury             | 障碍右上角纵坐标 |
| layers          | 障碍分布的绕线层 |
| is_except_pgnet | 是否只针对电源线 |

（6）以Instance的位置为中心，放置绕线障碍

```c++
void addRoutingHalo(const std::string &inst_name, int32_t top, int32_t bottom,
                      int32_t left, int32_t right,
                      const std::vector<std::string> &layers,
                      const bool &is_except_pgnet = false);
```

| 参数            | 含义                 |
| --------------- | -------------------- |
| inst_name       | 选中的instance的名字 |
| top             | 顶端扩展距离         |
| bottom          | 底端扩展距离         |
| left            | 左端扩展距离         |
| right           | 右端扩展距离         |
| layers          | 障碍分布的绕线层     |
| is_except_pgnet | 是否只针对电源线     |

（7）摆放Io Pin

摆放IO Pin的本质上是在金属层中，规划一个形状给IO，使其在金属层中有具体的体现

```c++
void placePort(std::string pin_name, int32_t x_offset, int32_t y_offset,
                 int32_t rect_width, int32_t rect_height,
                 std::string layer_name);
```

| 参数        | 含义                                              |
| ----------- | ------------------------------------------------- |
| pin_name    | Pin的名字                                         |
| x_offset    | 距离该IO Pin所属的IO CELL的左下角坐标的横向偏移量 |
| y_offset    | 距离该IO Pin所属的IO CELL的左下角坐标的纵向偏移量 |
| rect_width  | 矩形宽度                                          |
| rect_height | 矩形高度                                          |
| layer_name  | 摆放Pin的金属层                                   |

（8）摆放IO填充单元

```c++
void placeIOFiller(std::vector<std::string> filler_names,
                     const std::string &prefix, std::string source,
                     double begin_pos = -1, double end_pos = -1,
                     std::string edge = "");
```

| 参数         | 含义                 |
| ------------ | -------------------- |
| filler_names | 用于填充的单元的种类 |
| prefix       | 生成的单元的命名前缀 |
| source       | def中的source属性    |
| begin_pos    | 在某个边上的起始位置 |
| end_pos      | 在某个边上的结束位置 |
| edge         | 想在某个边上进行填充 |

如果后三个参数不设置，则直接默认对四个边进行IO单元的填充

（9）给电源网络添加IO

```c++
void addPowerNetIO(std::string net_name, std::string direction,
                     std::string pin_name = "");
```

| 参数      | 含义                                 |
| --------- | ------------------------------------ |
| net_name  | 需要添加IO的电源网络名               |
| direction | IO的direction属性                    |
| pin_name  | IO的名字，不设置则保持与网络名字相同 |

（10）摆放电源Pin

```c++
void placePowerPort(std::string pin_name, std::string io_cell_name,
                      int32_t offset_x, int32_t offset_y, int32_t width,
                      int32_t height, std::string layer_name);
```

| 参数         | 含义                                   |
| ------------ | -------------------------------------- |
| pin_name     | 摆放的Pin的名字                        |
| io_cell_name | 该Pin所属的IO                          |
| offset_x     | port的金属片距离IO的左下角的横向偏移量 |
| offset_y     | port的金属片距离IO的左下角的纵向偏移量 |
| width        | port矩形的宽度                         |
| height       | port矩形的高度                         |
| layer_name   | 摆放Pin的层                            |

（11）摆放物理单元

```c++
void placeTapAndEndcap(std::string tapcell_name, double distance,
                         std::string endcap_name);
```

| 参数         | 含义              |
| ------------ | ----------------- |
| tapcell_name | tapcell的种类     |
| distance     | 摆放tapcell的间距 |
| endcap_name  | endcap的种类      |

（12）创建全局电源网络

```c++
void createGlobalConnect(const std::string &pdn_net_name,
                           const std::string &instance_pdn_pin_name,
                           bool is_power);
```

| 参数                  | 含义                                   |
| --------------------- | -------------------------------------- |
| pdn_net_name          | 电源网络名                             |
| instance_pdn_pin_name | 连接至该电源网络的所有instance的引脚名 |
| is_power              | 是否是power电源网络                    |

（13）创建电源网络（在METAL1）

```c++
void createStandardCellRailPowerGrid(std::string power_net_name,
                                       std::string ground_net_name,
                                       std::string layer_name,
                                       double route_width, double route_offset);
```

| 参数            | 含义                               |
| --------------- | ---------------------------------- |
| power_net_name  | power电源网络名                    |
| ground_net_name | ground电源网络名                   |
| layer_name      | 创建电源网络的层（实际布线层）     |
| route_width     | 电源线宽度                         |
| route_offset    | 电源线偏移量（相对于左下角的坐标） |

（14）创建电源网络（高层金属）

```c++
void createStandardCellStripePowerGrid(std::string power_net_name,
                                         std::string ground_net_name,
                                         std::string layer_name,
                                         double route_width, double pitch,
                                         double route_offset);
```

| 参数            | 含义                                 |
| --------------- | ------------------------------------ |
| power_net_name  | power电源网络名                      |
| ground_net_name | ground电源网络名                     |
| layer_name      | 创建电源网络的层（实际布线层）       |
| route_width     | 电源线宽度                           |
| pitch           | 电源线之间的间距                     |
| route_offset    | 电源线的偏移量（相对于左下角的坐标） |

（15）将IO Pin连接至电源网路

```c++
void connectIOPinToPowerStripe(const std::vector<double> &point_list,
                                 const std::string &layer_name);
```

| 参数       | 含义                             |
| ---------- | -------------------------------- |
| point_list | 连接线的起点、终点、中间的转弯点 |
| layer_name | 连接线所处的布线层               |

（16）将Pin连接至电源网络（目前主要用于电源IO单元的 Pin）

```c++
void PdnConnectStripe(const std::vector<double> &point_list,
                                      const std::string &net_name,
                                      const std::string &layer_name,
                                      const int32_t &width);
```

| 参数       | 含义                             |
| ---------- | -------------------------------- |
| point_list | 连接线的起点、终点、中间的转弯点 |
| layer_name | 连接线所处的布线层               |
| net_name   | 连接到的电源网络的名字           |
| width      | 连接线的线宽                     |

（17）将不同层的电源网络连接（如VDD在METAL1，METAL4均有布线，则会将其通过via连接）

```c++
void connectTwoLayer(std::vector<std::string> layers);
```

| 参数   | 含义         |
| ------ | ------------ |
| layers | 需要连接的层 |

（18）输出def

```c++
void WriteToDef(const std::string &file_name);
```

| 参数      | 含义           |
| --------- | -------------- |
| file_name | 输出的文件路径 |

（19）将Macro连接至电源网络

```c++
void connectMacroToPdnGrid(std::vector<std::string> power_name,
                             std::vector<std::string> ground_name,
                             std::string layer_name_first,
                             std::string layer_name_second, std::string orient);
```

| 参数              | 含义                                |
| ----------------- | ----------------------------------- |
| power_name        | power引脚名                         |
| ground_name       | ground引脚名                        |
| layer_name_first  | macro引脚所处金属层（目前是METAL4） |
| layer_name_second | 想要连接到的电源网络的布线层        |
| orient            | 符合该朝向的macro才会进行电源连接   |

### 3.2 内部接口

> *内部模块之间的接口。*

## 4. 测试报告

### 4.1 测试环境

> *描述测试环境。*

### 4.2 测试结果

> 描述测试人员应该覆盖的功能点

| **测试****编号** | **测试****版本** | **测试功能点** | **测试****描述** |
| ---------------------- | ---------------------- | -------------------- | ---------------------- |
| TR01                   | V1.0                   |                      |                        |
| …                     | …                     | …                   | …                     |

### 4.3 比对

*图、表描述与第三方的性能比对。*

## 5. TO BE DONE

### 5.1 疑难问题

> *描述重点难点问题* ；
> 
> *说明在开发过程中遇到的问题，以及解决方法。例如：方法的选择、参数的处理、需要说明的其他具体问题。如果有不能正常工作的模块，说明具体情况，猜测可能的原因。*

### 5.2 待研究

> *待研究问题；*

